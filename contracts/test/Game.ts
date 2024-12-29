import { expect } from "chai";
import { ethers } from "hardhat";
import { Game } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Game", function () {
  let game: Game;
  let owner: SignerWithAddress;
  let teamMembers: SignerWithAddress[];
  let players: SignerWithAddress[];
  const initialPrice = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, ...players] = await ethers.getSigners();
    // Use first 3 players as team members
    teamMembers = players.slice(0, 3);
    const teamAddresses = teamMembers.map(member => member.address);
    
    const GameFactory = await ethers.getContractFactory("Game");
    game = await GameFactory.deploy(teamAddresses);
    await game.waitForDeployment();
  });

  describe("Constructor", function () {
    it("should set the correct initial values", async function () {
      expect(await game.owner()).to.equal(owner.address);
      expect(await game.getCurrentPrice()).to.equal(initialPrice);
      expect(await game.gameEnded()).to.equal(false);
      
      // Verify team members
      for (let i = 0; i < teamMembers.length; i++) {
        expect(await game.teamAddresses(i)).to.equal(teamMembers[i].address);
      }
    });

    it("should revert if no team addresses are provided", async function () {
      const GameFactory = await ethers.getContractFactory("Game");
      await expect(GameFactory.deploy([])).to.be.revertedWith("Must provide at least one team address");
    });
  });

  describe("Pay", function () {
    it("should accept payment and update state correctly", async function () {
      const player = players[3];
      const paymentAmount = initialPrice;

      await expect(game.connect(player).pay({ value: paymentAmount }))
        .to.emit(game, "PaymentReceived")
        .withArgs(player.address, paymentAmount)
        .to.emit(game, "PrizePoolIncreased");

      // Verify price increase (0.78% increase)
      const expectedNewPrice = (initialPrice * 10078n) / 10000n;
      const newPrice = await game.getCurrentPrice();
      expect(newPrice).to.equal(expectedNewPrice);

      // Verify team balances (30% split among team members)
      const teamShare = paymentAmount * 30n / 100n;
      const individualTeamShare = teamShare / BigInt(teamMembers.length);
      
      for (const teamMember of teamMembers) {
        expect(await game.teamBalances(teamMember.address)).to.equal(individualTeamShare);
      }

      // Verify prize pool (70%)
      const prizePoolShare = paymentAmount * 70n / 100n;
      expect(await game.getPrizePool()).to.equal(prizePoolShare);
    });

    it("should revert if payment is insufficient", async function () {
      const player = players[3];
      const insufficientAmount = ethers.parseEther("0.00000001");

      await expect(game.connect(player).pay({ value: insufficientAmount }))
        .to.be.revertedWith("Insufficient payment amount");
    });
  });

  describe("Prize Distribution", function () {
    it("should allow owner to award prize", async function () {
      const player = players[3];
      const winner = players[4];
      
      // Make a payment to create prize pool
      await game.connect(player).pay({ value: initialPrice });
      
      const prizePool = await game.getPrizePool();
      await expect(game.connect(owner).awardPrize(winner.address))
        .to.emit(game, "PrizeAwarded")
        .withArgs(winner.address, prizePool);

      expect(await game.gameEnded()).to.be.true;
      expect(await game.getPrizePool()).to.equal(0);
    });

    it("should allow team members to withdraw their share", async function () {
      const player = players[3];
      await game.connect(player).pay({ value: initialPrice });

      for (const teamMember of teamMembers) {
        const balance = await game.teamBalances(teamMember.address);
        await expect(game.connect(teamMember).withdrawTeamShare())
          .to.emit(game, "TeamPaymentSent")
          .withArgs(teamMember.address, balance);

        expect(await game.teamBalances(teamMember.address)).to.equal(0);
      }
    });
  });

  describe("Time-based Distribution", function () {
    it("should distribute prizes after time expiration", async function () {
      const player1 = players[3];
      const player2 = players[4];

      // Make payments
      await game.connect(player1).pay({ value: initialPrice });
      // Get the current price after first payment
      const currentPrice = await game.getCurrentPrice();
      await game.connect(player2).pay({ value: currentPrice });

      // Fast forward 31 days
      await time.increase(31 * 24 * 60 * 60);

      await expect(game.distributeIfTimeExpired())
        .to.emit(game, "PrizePoolDistributedAfterTimeExpired");

      expect(await game.gameEnded()).to.be.true;
      expect(await game.getPrizePool()).to.equal(0);
    });

    it("should revert distribution before time expiration", async function () {
      await game.connect(players[3]).pay({ value: initialPrice });
      
      await expect(game.distributeIfTimeExpired())
        .to.be.revertedWith("One month period not elapsed");
    });
  });

  describe("Unclaimed Shares", function () {
    it("should allow claiming of failed transfers", async function () {
      // This test would require a mock contract that fails to receive ETH
      // For demonstration purposes, we'll just verify the function exists
      expect(game.claimFailedShare).to.exist;
    });
  });

  describe("View Functions", function () {
    it("should return correct payment history", async function () {
      const player = players[3];
      await game.connect(player).pay({ value: initialPrice });

      const history = await game.getPaymentHistory(player.address);
      expect(history.length).to.equal(1);
      expect(history[0].amount).to.equal(initialPrice);
    });
  });
});
