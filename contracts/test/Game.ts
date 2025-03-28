import { expect } from "chai";
import { ethers } from "hardhat";
import { Game } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Game", function () {
  const ABANDONED_GAME_TIME = 7 * 24 * 60 * 60 + 1; // 7 days + 1 second

  let game: Game;
  let owner: SignerWithAddress;
  let teamAddress: SignerWithAddress;
  let player: SignerWithAddress;
  let nonPlayer: SignerWithAddress;
  let initialFee: bigint;

  beforeEach(async function () {
    [owner, teamAddress, player, nonPlayer] = await ethers.getSigners();
    
    const GameFactory = await ethers.getContractFactory("Game");
    game = await GameFactory.deploy(teamAddress.address) as Game;
    
    // Get the initialFee from the contract
    initialFee = await game.initialFee();
  });

  async function advanceToAbandonedGameTime() {
    await ethers.provider.send("evm_increaseTime", [ABANDONED_GAME_TIME]);
    await ethers.provider.send("evm_mine", []);
  }

  describe("Constructor", function () {
    it("should set the correct initial values", async function () {
      expect(await game.owner()).to.equal(owner.address);
      expect(await game.teamAddress()).to.equal(teamAddress.address);
      expect(await game.lastPaidFee()).to.equal(initialFee);
      expect(await game.gameEnded()).to.equal(false);
      expect(await game.deploymentTime()).to.not.equal(0);
    });

    it("should revert if team address is zero", async function () {
      const GameFactory = await ethers.getContractFactory("Game");
      await expect(GameFactory.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(game, "InvalidTeamAddress");
    });
  });

  describe("PayFee", function () {
    it("should accept fee payment and update state correctly", async function () {
      const paymentAmount = initialFee;
      await expect(game.connect(player).payFee({ value: paymentAmount }))
        .to.emit(game, "FeePaymentReceived")
        .to.emit(game, "TeamShareIncreased")
        .to.emit(game, "NextGameShareIncreased")
        .to.emit(game, "PrizePoolIncreased");

      expect(await game.lastPlayerAddress()).to.equal(player.address);
      expect(await game.totalPaymentsPerUser(player.address)).to.equal(paymentAmount);
      expect(await game.totalPayments()).to.equal(paymentAmount);
      expect(await game.lastPaymentTime()).to.not.equal(0);
      
      // Check the lastPaidFee is updated to the payment amount
      expect(await game.lastPaidFee()).to.equal(paymentAmount);
    });

    it("should revert if payment is insufficient", async function () {
      const insufficientAmount = initialFee - 1n;
      await expect(game.connect(player).payFee({ value: insufficientAmount }))
        .to.be.revertedWithCustomError(game, "InsufficientFeePayment");
    });

    it("should distribute fees correctly between team, next game share and prize pool", async function () {
      const paymentAmount = initialFee;
      await game.connect(player).payFee({ value: paymentAmount });
      
      const expectedTeamShare = (paymentAmount * 10n) / 100n;
      const expectedNextGameShare = (paymentAmount * 20n) / 100n;
      const expectedPrizePool = paymentAmount - expectedTeamShare - expectedNextGameShare;
      
      expect(await game.teamShare()).to.equal(expectedTeamShare);
      expect(await game.nextGameShare()).to.equal(expectedNextGameShare);
      expect(await game.prizePool()).to.equal(expectedPrizePool);
    });

    it("should update lastPaidFee to the amount paid", async function () {
      // Pay with higher amount than the initial fee
      const higherAmount = initialFee * 2n;
      await game.connect(player).payFee({ value: higherAmount });
      
      // Verify lastPaidFee is updated to the payment amount
      expect(await game.lastPaidFee()).to.equal(higherAmount);
      
      // Make another payment with different amount
      const nextAmount = initialFee * 3n;
      await game.connect(player).payFee({ value: nextAmount });
      
      // Verify lastPaidFee is updated to the new payment amount
      expect(await game.lastPaidFee()).to.equal(nextAmount);
    });

    it("should revert if game has ended", async function () {
      // First payment
      await game.connect(player).payFee({ value: initialFee });
      
      // End the game by setting a winner
      await game.connect(owner).setWinner(player.address);
      
      // Try to pay fee after game has ended
      await expect(game.connect(player).payFee({ value: initialFee }))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });
  });

  describe("Prize Distribution", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: initialFee });
    });

    it("should allow owner to set winner", async function () {
      await expect(game.connect(owner).setWinner(player.address))
        .to.emit(game, "GameEnded")
        .to.emit(game, "WinnerAdded");
      
      expect(await game.gameEnded()).to.be.true;
      expect(await game.winnerAddress()).to.equal(player.address);
    });

    it("should revert if non-owner tries to set winner", async function () {
      await expect(game.connect(player).setWinner(player.address))
        .to.be.revertedWithCustomError(game, "NotOwner");
    });

    it("should allow owner to award prize", async function () {
      await game.connect(owner).setWinner(player.address);
      const prizePoolBefore = await game.prizePool();
      
      await expect(game.connect(owner).awardPrize())
        .to.emit(game, "PrizeAwarded")
        .withArgs(prizePoolBefore, player.address);
        
      expect(await game.prizePool()).to.equal(0);
    });

    it("should revert if setting winner when game has ended", async function () {
      await game.connect(owner).setWinner(player.address);
      
      await expect(game.connect(owner).setWinner(player.address))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });

    it("should revert if setting winner with zero address", async function () {
      await expect(game.connect(owner).setWinner(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(game, "InvalidWinnerAddress");
    });

    it("should revert if awarding prize when game has not ended", async function () {
      await expect(game.connect(owner).awardPrize())
        .to.be.revertedWithCustomError(game, "GameNotEnded");
    });

    it("should revert if awarding prize with empty prize pool", async function () {
      await game.connect(owner).setWinner(player.address);
      await game.connect(owner).awardPrize(); // First award empties pool
      
      await expect(game.connect(owner).awardPrize())
        .to.be.revertedWithCustomError(game, "EmptyPrizePool");
    });
  });

  describe("Team Share Withdrawal", function () {
    it("should allow team address to withdraw share", async function () {
      await game.connect(player).payFee({ value: initialFee });
      
      const initialBalance = await ethers.provider.getBalance(teamAddress.address);
      await expect(game.connect(teamAddress).withdrawTeamShare())
        .to.emit(game, "TeamShareWithdrawn");
      
      const finalBalance = await ethers.provider.getBalance(teamAddress.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await game.teamShare()).to.equal(0);
    });

    it("should revert if non-team address tries to withdraw", async function () {
      await game.connect(player).payFee({ value: initialFee });
      
      await expect(game.connect(player).withdrawTeamShare())
        .to.be.revertedWithCustomError(game, "NotTeamAddress");
    });

    it("should revert if no team share to withdraw", async function () {
      await expect(game.connect(teamAddress).withdrawTeamShare())
        .to.be.revertedWithCustomError(game, "NoTeamShareToWithdraw");
    });
  });

  describe("Next Game Share Withdrawal", function () {
    it("should allow team address to withdraw next game share", async function () {
      await game.connect(player).payFee({ value: initialFee });
      
      const initialBalance = await ethers.provider.getBalance(teamAddress.address);
      const expectedNextGameShare = (initialFee * 20n) / 100n;
      
      await expect(game.connect(teamAddress).withdrawNextGameShare())
        .to.emit(game, "NextGameShareWithdrawn")
        .withArgs(expectedNextGameShare);
      
      const finalBalance = await ethers.provider.getBalance(teamAddress.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await game.nextGameShare()).to.equal(0);
    });

    it("should revert if non-team address tries to withdraw next game share", async function () {
      await game.connect(player).payFee({ value: initialFee });
      
      await expect(game.connect(player).withdrawNextGameShare())
        .to.be.revertedWithCustomError(game, "NotTeamAddress");
    });

    it("should revert if game has not ended", async function () {
      await expect(game.connect(teamAddress).withdrawNextGameShare())
        .to.be.revertedWithCustomError(game, "GameNotEnded");
    });

    it("should revert if no next game share to withdraw", async function () {
      await expect(game.connect(teamAddress).withdrawNextGameShare())
        .to.be.revertedWithCustomError(game, "NoNextGameShareToWithdraw");
    });
  });

  describe("Abandoned Game Claims", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: initialFee });
    });

    it("should allow claiming abandoned game share after time elapsed", async function () {
      await advanceToAbandonedGameTime();

      await expect(game.connect(player).claimAbandonedGameShare())
        .to.emit(game, "GameEnded")
        .to.emit(game, "GameAbandoned")
        .to.emit(game, "AbandonedGameUserShareClaimed");

      expect(await game.gameEnded()).to.be.true;
      expect(await game.gameAbandoned()).to.be.true;
      expect(await game.claimedAbandonedGameUserShares(player.address)).to.be.true;
    });

    it("should revert if claiming before time elapsed", async function () {
      await expect(game.connect(player).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "AbandonedGameTimeNotElapsed");
    });

    it("should revert if user has not made any fee payments", async function () {
      await advanceToAbandonedGameTime();

      await expect(game.connect(nonPlayer).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "NoFeePaymentMade");
    });

    it("should revert if user has already claimed abandoned game share", async function () {
      await advanceToAbandonedGameTime();

      await game.connect(player).claimAbandonedGameShare();
      
      await expect(game.connect(player).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "AbandonedGameUserShareAlreadyClaimed");
    });

    it("should revert if prize pool is empty", async function () {
      await game.connect(owner).setWinner(player.address);
      await game.connect(owner).awardPrize(); // Empty the prize pool
      
      await advanceToAbandonedGameTime();

      await expect(game.connect(player).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "EmptyPrizePool");
    });
  });

  describe("Unclaimed Shares", function () {
    it("should revert if no unclaimed shares", async function () {
      await expect(game.connect(player).claimUserShare())
        .to.be.revertedWithCustomError(game, "NoUnclaimedShares");
    });
  });

  describe("Prize Pool Funding", function () {
    it("should allow anyone to fund the prize pool", async function () {
      const fundAmount = ethers.parseEther("1.0");
      
      await expect(game.connect(player).fundPrizePool({ value: fundAmount }))
        .to.emit(game, "PrizePoolFunded")
        .withArgs(fundAmount)
        .to.emit(game, "PrizePoolIncreased")
        .withArgs(fundAmount);

      expect(await game.prizePool()).to.equal(fundAmount);
    });

    it("should revert if game has ended", async function () {
      // End the game
      await game.connect(player).payFee({ value: initialFee });
      await game.connect(owner).setWinner(player.address);
      
      const fundAmount = ethers.parseEther("1.0");
      await expect(game.connect(player).fundPrizePool({ value: fundAmount }))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });

    it("should revert if funding amount is zero", async function () {
      await expect(game.connect(player).fundPrizePool({ value: 0 }))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("should allow funding after abandonment time and reset the timer", async function () {
      // First payment
      await game.connect(player).payFee({ value: initialFee });
      
      // Calculate the initial prize pool contribution (70% of initialFee)
      const initialPrizePoolContribution = initialFee - ((initialFee * 10n) / 100n) - ((initialFee * 20n) / 100n);
      
      await advanceToAbandonedGameTime();
      
      const fundAmount = ethers.parseEther("1.0");
      await expect(game.connect(player).fundPrizePool({ value: fundAmount }))
        .to.emit(game, "PrizePoolFunded")
        .withArgs(fundAmount)
        .to.emit(game, "PrizePoolIncreased")
        .withArgs(initialPrizePoolContribution + fundAmount);

      expect(await game.prizePool()).to.equal(initialPrizePoolContribution + fundAmount);
      expect(await game.lastPaymentTime()).to.equal(await ethers.provider.getBlock("latest").then(b => b?.timestamp ?? 0));
    });
  });

  describe("Next Game Share", function () {
    let mockGame: Game;
    let mockGameAddress: string;
    
    beforeEach(async function () {
      // Make a payment to create next game share
      await game.connect(player).payFee({ value: initialFee });
      
      // Deploy a mock game contract that will receive the next game share
      const GameFactory = await ethers.getContractFactory("Game");
      mockGame = await GameFactory.deploy(teamAddress.address) as Game;
      mockGameAddress = await mockGame.getAddress();
    });

    it("should allow owner to send next game share after game has ended", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      const nextGameShareAmount = (initialFee * 20n) / 100n;
      const mockGamePrizePoolBefore = await mockGame.prizePool();
      
      await expect(game.connect(owner).sendNextGameShare(mockGame))
        .to.emit(game, "NextGameShareSent")
        .withArgs(nextGameShareAmount, mockGameAddress);

      const mockGamePrizePoolAfter = await mockGame.prizePool();
      expect(mockGamePrizePoolAfter).to.equal(mockGamePrizePoolBefore + nextGameShareAmount);
      expect(await game.nextGameShare()).to.equal(0);
    });

    it("should revert if non-owner tries to send next game share", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      await expect(game.connect(player).sendNextGameShare(mockGame))
        .to.be.revertedWithCustomError(game, "NotOwner");
    });

    it("should revert if trying to send next game share before game has ended", async function () {
      await expect(game.connect(owner).sendNextGameShare(mockGame))
        .to.be.revertedWithCustomError(game, "GameNotEnded");
    });

    it("should revert if recipient contract call fails", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      // End the mock game to make fundPrizePool revert
      await mockGame.connect(owner).setWinner(player.address);
      
      await expect(game.connect(owner).sendNextGameShare(mockGame))
        .to.be.revertedWithCustomError(game, "NextGameShareSendFailed");
    });

    it("should emit event with zero amount when trying to send next game share when there is none", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      // Send the next game share first
      await game.connect(owner).sendNextGameShare(mockGame);
      
      // Try to send again - should emit event with 0 amount
      await expect(game.connect(owner).sendNextGameShare(mockGame))
        .to.emit(game, "NextGameShareSent")
        .withArgs(0, mockGameAddress);
    });
  });

  describe("Send Team Share", function () {
    beforeEach(async function () {
      // Make a payment to create team share
      await game.connect(player).payFee({ value: initialFee });
    });

    it("should allow owner to send team share after game has ended", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      const teamShareAmount = (initialFee * 10n) / 100n;
      const teamBalanceBefore = await ethers.provider.getBalance(teamAddress.address);
      
      await expect(game.connect(owner).sendTeamShare())
        .to.emit(game, "TeamShareSent")
        .withArgs(teamShareAmount);

      const teamBalanceAfter = await ethers.provider.getBalance(teamAddress.address);
      expect(teamBalanceAfter).to.be.gt(teamBalanceBefore);
      expect(await game.teamShare()).to.equal(0);
    });

    it("should revert if non-owner tries to send team share", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      await expect(game.connect(player).sendTeamShare())
        .to.be.revertedWithCustomError(game, "NotOwner");
    });

    it("should revert if trying to send team share before game has ended", async function () {
      await expect(game.connect(owner).sendTeamShare())
        .to.be.revertedWithCustomError(game, "GameNotEnded");
    });

    it("should emit event with zero amount when trying to send team share when there is none", async function () {
      // End the game
      await game.connect(owner).setWinner(player.address);
      
      // Send the team share first
      await game.connect(owner).sendTeamShare();
      
      // Try to send again - should emit event with 0 amount
      await expect(game.connect(owner).sendTeamShare())
        .to.emit(game, "TeamShareSent")
        .withArgs(0);
    });
  });
});
