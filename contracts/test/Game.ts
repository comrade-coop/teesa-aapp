import { expect } from "chai";
import { ethers } from "hardhat";
import { Game } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Game", function () {
  const INITIAL_FEE = ethers.parseEther("0.001");
  const ABANDONED_GAME_TIME = 30 * 24 * 60 * 60 + 1; // 30 days + 1 second

  let game: Game;
  let owner: SignerWithAddress;
  let teamAddress: SignerWithAddress;
  let player: SignerWithAddress;
  let nonPlayer: SignerWithAddress;

  beforeEach(async function () {
    [owner, teamAddress, player, nonPlayer] = await ethers.getSigners();
    
    const GameFactory = await ethers.getContractFactory("Game");
    game = await GameFactory.deploy(teamAddress.address) as Game;
  });

  async function advanceToAbandonedGameTime() {
    await ethers.provider.send("evm_increaseTime", [ABANDONED_GAME_TIME]);
    await ethers.provider.send("evm_mine", []);
  }

  describe("Constructor", function () {
    it("should set the correct initial values", async function () {
      expect(await game.owner()).to.equal(owner.address);
      expect(await game.teamAddress()).to.equal(teamAddress.address);
      expect(await game.currentFee()).to.equal(INITIAL_FEE);
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
      const paymentAmount = INITIAL_FEE;
      await expect(game.connect(player).payFee({ value: paymentAmount }))
        .to.emit(game, "FeePaymentReceived")
        .to.emit(game, "TeamShareIncreased")
        .to.emit(game, "PrizePoolIncreased")
        .to.emit(game, "FeeIncreased");

      expect(await game.lastPlayerAddress()).to.equal(player.address);
      expect(await game.totalPaymentsPerUser(player.address)).to.equal(paymentAmount);
      expect(await game.totalPayments()).to.equal(paymentAmount);
      expect(await game.lastPaymentTime()).to.not.equal(0);
      
      // Check new fee amount (1% increase)
      const expectedNewFee = (paymentAmount * 101n) / 100n;
      expect(await game.currentFee()).to.equal(expectedNewFee);
    });

    it("should revert if payment is insufficient", async function () {
      const insufficientAmount = INITIAL_FEE - 1n;
      await expect(game.connect(player).payFee({ value: insufficientAmount }))
        .to.be.revertedWithCustomError(game, "InsufficientFeePayment");
    });

    it("should distribute fees correctly between team and prize pool", async function () {
      const paymentAmount = INITIAL_FEE;
      await game.connect(player).payFee({ value: paymentAmount });
      
      const expectedTeamShare = (paymentAmount * 20n) / 100n;
      const expectedPrizePool = paymentAmount - expectedTeamShare;
      
      expect(await game.teamShare()).to.equal(expectedTeamShare);
      expect(await game.prizePool()).to.equal(expectedPrizePool);
    });

    it("should revert if game has ended", async function () {
      // First payment
      await game.connect(player).payFee({ value: INITIAL_FEE });
      
      // End the game by setting a winner
      await game.connect(owner).setWinner(player.address);
      
      // Try to pay fee after game has ended
      await expect(game.connect(player).payFee({ value: INITIAL_FEE }))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });
  });

  describe("Prize Distribution", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
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
      await game.connect(player).payFee({ value: INITIAL_FEE });
      
      const initialBalance = await ethers.provider.getBalance(teamAddress.address);
      await expect(game.connect(teamAddress).withdrawTeamShare())
        .to.emit(game, "TeamShareWithdrawn");
      
      const finalBalance = await ethers.provider.getBalance(teamAddress.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await game.teamShare()).to.equal(0);
    });

    it("should revert if non-team address tries to withdraw", async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
      
      await expect(game.connect(player).withdrawTeamShare())
        .to.be.revertedWithCustomError(game, "NotTeamAddress");
    });

    it("should revert if no team share to withdraw", async function () {
      await expect(game.connect(teamAddress).withdrawTeamShare())
        .to.be.revertedWithCustomError(game, "NoTeamShareToWithdraw");
    });
  });

  describe("Abandoned Game Claims", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
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

  describe("Owner Funds Transfer", function () {
    it("should allow owner to transfer funds to contract", async function () {
      const transferAmount = ethers.parseEther("1.0");
      
      await expect(game.connect(owner).transferOwnerFundsToContract({ value: transferAmount }))
        .to.emit(game, "TeamShareIncreased")
        .withArgs(transferAmount);

      expect(await game.teamShare()).to.equal(transferAmount);
    });

    it("should revert if non-owner tries to transfer funds", async function () {
      const transferAmount = ethers.parseEther("1.0");
      
      await expect(game.connect(player).transferOwnerFundsToContract({ value: transferAmount }))
        .to.be.revertedWithCustomError(game, "NotOwner");
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
      await game.connect(player).payFee({ value: INITIAL_FEE });
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
      await game.connect(player).payFee({ value: INITIAL_FEE });
      
      // Calculate the initial prize pool contribution (80% of INITIAL_FEE)
      const initialPrizePoolContribution = (INITIAL_FEE * 80n) / 100n;
      
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
});
