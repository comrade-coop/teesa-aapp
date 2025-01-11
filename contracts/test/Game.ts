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
      expect(await game.userTotalPayments(player.address)).to.equal(paymentAmount);
      
      // Check new fee amount (0.78% increase)
      const expectedNewFee = (paymentAmount * 10078n) / 10000n;
      expect(await game.currentFee()).to.equal(expectedNewFee);
    });

    it("should revert if payment is insufficient", async function () {
      const insufficientAmount = INITIAL_FEE - ethers.parseEther("0.0001");
      await expect(game.connect(player).payFee({ value: insufficientAmount }))
        .to.be.revertedWithCustomError(game, "InsufficientFeePayment");
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

    it("should allow owner to award prize", async function () {
      await game.connect(owner).addWinner(player.address);
      
      await expect(game.connect(owner).awardPrize())
        .to.emit(game, "PrizeAwarded");
      expect(await game.prizePool()).to.equal(0);
    });

    it("should allow team members to withdraw their share", async function () {
      await expect(game.connect(teamMember).withdrawTeamShare())
        .to.emit(game, "TeamShareWithdrawn");
    });
  });

  describe("User Share Claims", function () {
    beforeEach(async function () {
      const paymentAmount = INITIAL_FEE;
      await game.connect(player).payFee({ value: paymentAmount });
    });

    it("should allow users to claim their share after time expiration", async function () {
      // Advance time by 31 days
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(game.connect(player).claimUserShare())
        .to.emit(game, "UnclaimedUserShareClaimed");
    });

    it("should revert claim before time expiration", async function () {
      await expect(game.connect(player).claimUserShare())
        .to.be.revertedWithCustomError(game, "TimeNotElapsed");
    });

    it("should revert if user has not made any payments", async function () {
      const nonPlayer = (await ethers.getSigners())[3];
      await expect(game.connect(nonPlayer).claimUserShare())
        .to.be.revertedWithCustomError(game, "NoFeePaymentMade");
    });  
    
    it("should revert claim if game has ended", async function () {
      await game.connect(owner).addWinner(player.address);
      await expect(game.connect(player).claimUserShare())
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });
  });

  describe("Game State", function () {
    it("should not allow fee payments after game has ended", async function () {
      const paymentAmount = INITIAL_FEE;
      await game.connect(player).payFee({ value: paymentAmount });
      await game.connect(owner).addWinner(player.address);

      await expect(game.connect(player).payFee({ value: paymentAmount }))
        .to.be.revertedWithCustomError(game, "GameHasEnded");
    });

    it("should not allow adding winner with empty prize pool", async function () {
      await expect(game.connect(owner).addWinner(player.address))
        .to.be.revertedWithCustomError(game, "EmptyPrizePool");
    });
  });
});
