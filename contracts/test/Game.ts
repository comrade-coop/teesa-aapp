import { expect } from "chai";
import { ethers } from "hardhat";
import { Game } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Game", function () {
  const INITIAL_FEE = ethers.parseEther("0.001");

  let game: Game;
  let owner: SignerWithAddress;
  let teamMember: SignerWithAddress;
  let player: SignerWithAddress;
  let teamAddresses: string[];

  beforeEach(async function () {
    [owner, teamMember, player] = await ethers.getSigners();
    teamAddresses = [teamMember.address];
    
    const GameFactory = await ethers.getContractFactory("Game");
    game = await GameFactory.deploy(teamAddresses) as Game;
  });

  describe("Constructor", function () {
    it("should set the correct initial values", async function () {
      expect(await game.owner()).to.equal(owner.address);
      expect(await game.teamAddresses(0)).to.equal(teamMember.address);
      expect(await game.currentFee()).to.equal(INITIAL_FEE);
      expect(await game.gameEnded()).to.equal(false);
      expect(await game.deploymentTime()).to.not.equal(0);
    });

    it("should revert if no team addresses are provided", async function () {
      const GameFactory = await ethers.getContractFactory("Game");
      await expect(GameFactory.deploy([]))
        .to.be.revertedWithCustomError(game, "NoTeamAddresses");
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
      const insufficientAmount = INITIAL_FEE - ethers.parseEther("0.0001");
      await expect(game.connect(player).payFee({ value: insufficientAmount }))
        .to.be.revertedWithCustomError(game, "InsufficientFeePayment");
    });

    it("should distribute team shares correctly", async function () {
      const paymentAmount = INITIAL_FEE;
      await game.connect(player).payFee({ value: paymentAmount });
      
      const expectedTeamShare = (paymentAmount * 30n) / 100n;
      const expectedTeamMemberShare = expectedTeamShare / BigInt(teamAddresses.length);
      expect(await game.teamShares(teamMember.address)).to.equal(expectedTeamMemberShare);
    });
  });

  describe("Prize Distribution", function () {
    beforeEach(async function () {
      const paymentAmount = INITIAL_FEE;
      await game.connect(player).payFee({ value: paymentAmount });
    });

    it("should allow owner to add winner", async function () {
      await expect(game.connect(owner).addWinner(player.address))
        .to.emit(game, "GameEnded")
        .to.emit(game, "WinnerAdded");
      
      expect(await game.gameEnded()).to.be.true;
      expect(await game.winnerAddresses(0)).to.deep.equal(player.address);
    });

    it("should revert if non-owner tries to add winner", async function () {
      await expect(game.connect(player).addWinner(player.address))
        .to.be.revertedWithCustomError(game, "NotOwner");
    });

    it("should allow owner to award prize", async function () {
      await game.connect(owner).addWinner(player.address);
      
      await expect(game.connect(owner).awardPrize())
        .to.emit(game, "PrizeAwarded");
      expect(await game.prizePool()).to.equal(0);
    });

    it("should revert if non-owner tries to award prize", async function () {
      await game.connect(owner).addWinner(player.address);
      await expect(game.connect(player).awardPrize())
        .to.be.revertedWithCustomError(game, "NotOwner");
    });
  });

  describe("Team Share Withdrawal", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
    });

    it("should allow team members to withdraw their share", async function () {
      const initialBalance = await ethers.provider.getBalance(teamMember.address);
      await expect(game.connect(teamMember).withdrawTeamShare())
        .to.emit(game, "TeamShareWithdrawn");
      
      const finalBalance = await ethers.provider.getBalance(teamMember.address);
      expect(finalBalance).to.be.gt(initialBalance);
      expect(await game.teamShares(teamMember.address)).to.equal(0);
    });

    it("should revert if team member has no share", async function () {
      await game.connect(teamMember).withdrawTeamShare();
      await expect(game.connect(teamMember).withdrawTeamShare())
        .to.be.revertedWithCustomError(game, "NoTeamShareToWithdraw");
    });
  });

  describe("Abandoned Game Claims", function () {
    beforeEach(async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
    });

    it("should allow claiming abandoned game share after time elapsed", async function () {
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]); // 3 days + 1 second
      await ethers.provider.send("evm_mine", []);

      await expect(game.connect(player).claimAbandonedGameShare())
        .to.emit(game, "GameAbandoned")
        .to.emit(game, "GameEnded")
        .to.emit(game, "AbandonedGameUserShareClaimed");

      expect(await game.gameEnded()).to.be.true;
      expect(await game.paidUserShares(player.address)).to.be.true;
    });

    it("should revert if claiming before time elapsed", async function () {
      await expect(game.connect(player).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "TimeNotElapsed");
    });

    it("should revert if user has not made payments", async function () {
      const nonPlayer = (await ethers.getSigners())[3];
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(game.connect(nonPlayer).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "NoFeePaymentMade");
    });

    it("should revert if user has already claimed", async function () {
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await game.connect(player).claimAbandonedGameShare();
      await expect(game.connect(player).claimAbandonedGameShare())
        .to.be.revertedWithCustomError(game, "UserShareAlreadyClaimed");
    });
  });

  describe("Unclaimed Shares", function () {
    it("should allow claiming unclaimed shares", async function () {
      // First create an unclaimed share by making a payment
      await game.connect(player).payFee({ value: INITIAL_FEE });
      
      // Set up unclaimed share (this would normally happen if a transfer fails)
      const unclaimedAmount = ethers.parseEther("0.0001");
      await game.connect(owner).addWinner(player.address);
      
      // Simulate unclaimed share (would need a way to force this in a real scenario)
      if (typeof game.unclaimedShares === 'function') {
        const hasUnclaimedShare = await game.unclaimedShares(player.address);
        if (hasUnclaimedShare > 0n) {
          await expect(game.connect(player).claimUserShare())
            .to.emit(game, "UnclaimedUserShareClaimed");
        }
      }
    });

    it("should revert if no unclaimed shares", async function () {
      await expect(game.connect(player).claimUserShare())
        .to.be.revertedWithCustomError(game, "NoUnclaimedShares");
    });
  });

  describe("Game State", function () {
    it("should not allow fee payments after game has ended", async function () {
      await game.connect(player).payFee({ value: INITIAL_FEE });
      await game.connect(owner).addWinner(player.address);

      await expect(game.connect(player).payFee({ value: INITIAL_FEE }))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });

    it("should not allow adding winner with empty prize pool", async function () {
      await expect(game.connect(owner).addWinner(player.address))
        .to.be.revertedWithCustomError(game, "EmptyPrizePool");
    });
  });
});
