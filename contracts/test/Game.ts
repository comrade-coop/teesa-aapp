import { expect } from "chai";
import { ethers } from "hardhat";
import { Game } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Game", function () {
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
      expect(await game.currentPrice()).to.equal(ethers.parseEther("0.001"));
    });

    it("should revert if no team addresses are provided", async function () {
      const GameFactory = await ethers.getContractFactory("Game");
      await expect(GameFactory.deploy([]))
        .to.be.revertedWithCustomError(game, "InvalidTeamAddresses");
    });
  });

  describe("Pay", function () {
    it("should accept payment and update state correctly", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      await expect(game.connect(player).pay({ value: paymentAmount }))
        .to.emit(game, "Payment")
        .to.emit(game, "PaymentReceived");
    });

    it("should revert if payment is insufficient", async function () {
      const insufficientAmount = ethers.parseEther("0.0009");
      await expect(game.connect(player).pay({ value: insufficientAmount }))
        .to.be.revertedWithCustomError(game, "InsufficientPayment");
    });
  });

  describe("Prize Distribution", function () {
    it("should allow owner to award prize", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      await game.connect(player).pay({ value: paymentAmount });
      
      await expect(game.connect(owner).awardPrize(player.address))
        .to.emit(game, "PrizeAwarded");
    });

    it("should allow team members to withdraw their share", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      await game.connect(player).pay({ value: paymentAmount });
      
      await expect(game.connect(teamMember).withdrawTeamShare())
        .to.emit(game, "TeamPaymentSent");
    });
  });

  describe("Time-based Distribution", function () {
    it("should distribute prizes after time expiration", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      await game.connect(player).pay({ value: paymentAmount });
      
      // Advance time by 31 days
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(game.distributeIfTimeExpired())
        .to.emit(game, "PrizePoolDistributedAfterTimeExpired");
    });

    it("should revert distribution before time expiration", async function () {
      await expect(game.distributeIfTimeExpired())
        .to.be.revertedWithCustomError(game, "TimeNotElapsed");
    });
  });

  describe("Unclaimed Shares", function () {
    it("should allow claiming of failed transfers", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      await game.connect(player).pay({ value: paymentAmount });
      
      // Test logic for claiming unclaimed shares
      // This might need to be adjusted based on how you simulate failed transfers
    });
  });
});
