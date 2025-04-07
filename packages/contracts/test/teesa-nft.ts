const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TeesaNft Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployNftFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const TeesaNft = await ethers.getContractFactory("TeesaNft");
    const name = "Teesa";
    const symbol = "TEESA";
    const royaltyReceiver = owner.address; // Example royalty receiver
    const royaltyFeeNumerator = 500; // Example fee: 5% (500 / 10000)
    const teesaNft = await TeesaNft.deploy(name, symbol, royaltyReceiver, royaltyFeeNumerator);

    return { teesaNft, name, symbol, owner, otherAccount, royaltyReceiver, royaltyFeeNumerator };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { teesaNft, owner } = await loadFixture(deployNftFixture);
      expect(await teesaNft.owner()).to.equal(owner.address);
    });

    it("Should set the right name and symbol", async function () {
      const { teesaNft, name, symbol } = await loadFixture(deployNftFixture);
      expect(await teesaNft.name()).to.equal(name);
      expect(await teesaNft.symbol()).to.equal(symbol);
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint an NFT and return the token ID", async function () {
      const { teesaNft, otherAccount } = await loadFixture(deployNftFixture);
      const tokenURI = "ipfs://somehash1";
      const expectedTokenId = 0; // First token ID should be 0

      // Capture the returned tokenId
      const mintTx = await teesaNft.mint(otherAccount.address, tokenURI);
      const receipt = await mintTx.wait();
      const transferEvent = receipt.logs.find((log: any) => log.fragment.name === 'Transfer');
      const returnedTokenId = transferEvent.args.tokenId; // Extract from event as return value isn't directly available without callStatic or similar

      // Check event emission with the correct tokenId
      await expect(mintTx)
        .to.emit(teesaNft, "Transfer")
        .withArgs(ethers.ZeroAddress, otherAccount.address, expectedTokenId);

      expect(returnedTokenId).to.equal(expectedTokenId);
      expect(await teesaNft.ownerOf(expectedTokenId)).to.equal(otherAccount.address);
      expect(await teesaNft.tokenURI(expectedTokenId)).to.equal(tokenURI);
      expect(await teesaNft.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should increment token IDs", async function () {
      const { teesaNft, owner, otherAccount } = await loadFixture(deployNftFixture);
      const uri1 = "ipfs://hash1";
      const uri2 = "ipfs://hash2";

      // Check returned tokenId
      const returnedTokenId1 = await teesaNft.mint.staticCall(otherAccount.address, uri1);
      await teesaNft.mint(otherAccount.address, uri1); // Actual mint

      const returnedTokenId2 = await teesaNft.mint.staticCall(owner.address, uri2);
      await teesaNft.mint(owner.address, uri2); // Actual mint

      expect(returnedTokenId1).to.equal(0);
      expect(returnedTokenId2).to.equal(1);
    });

    it("Should fail if a non-owner tries to mint", async function () {
      const { teesaNft, otherAccount } = await loadFixture(deployNftFixture);
      const tokenURI = "ipfs://somehash2";

      await expect(
        teesaNft.connect(otherAccount).mint(otherAccount.address, tokenURI)
      ).to.be.revertedWithCustomError(teesaNft, "OwnableUnauthorizedAccount")
       .withArgs(otherAccount.address);
    });

     it("Should correctly set the token URI", async function () {
      const { teesaNft, owner } = await loadFixture(deployNftFixture);
      const tokenURI = "ipfs://uniquehash";
      const tokenId = 0;

      await teesaNft.mint(owner.address, tokenURI);
      expect(await teesaNft.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });

  describe("Ownership", function () {
    it("Should allow the owner to transfer ownership", async function () {
      const { teesaNft, owner, otherAccount } = await loadFixture(deployNftFixture);

      await expect(teesaNft.transferOwnership(otherAccount.address))
        .to.emit(teesaNft, "OwnershipTransferred")
        .withArgs(owner.address, otherAccount.address);

      expect(await teesaNft.owner()).to.equal(otherAccount.address);
    });

     it("Should prevent non-owners from transferring ownership", async function () {
      const { teesaNft, otherAccount } = await loadFixture(deployNftFixture);

      await expect(
        teesaNft.connect(otherAccount).transferOwnership(otherAccount.address)
      ).to.be.revertedWithCustomError(teesaNft, "OwnableUnauthorizedAccount")
       .withArgs(otherAccount.address);
    });

    it("Should allow the new owner to mint", async function () {
      const { teesaNft, owner, otherAccount } = await loadFixture(deployNftFixture);
      const tokenURI = "ipfs://newownerhash";
      const tokenId = 0;

      await teesaNft.transferOwnership(otherAccount.address);

      // Minting should now work for otherAccount
      await expect(teesaNft.connect(otherAccount).mint(owner.address, tokenURI))
        .to.emit(teesaNft, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, tokenId);

      // Minting should fail for the old owner
      await expect(
        teesaNft.connect(owner).mint(owner.address, "ipfs://oldownerfail")
       ).to.be.revertedWithCustomError(teesaNft, "OwnableUnauthorizedAccount")
       .withArgs(owner.address);
    });
  });

  describe("Royalties", function () {
    it("Should support the ERC2981, ERC721 and ERC721Metadata interfaces", async function () {
      const { teesaNft } = await loadFixture(deployNftFixture);
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      const ERC721METADATA_INTERFACE_ID = "0x5b5e139f";

      expect(await teesaNft.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
      expect(await teesaNft.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
      expect(await teesaNft.supportsInterface(ERC721METADATA_INTERFACE_ID)).to.be.true;
    });

    it("Should return the correct royalty info", async function () {
      const { teesaNft, otherAccount, royaltyReceiver, royaltyFeeNumerator } = await loadFixture(deployNftFixture);
      const tokenId = 0;
      const salePrice = ethers.parseEther("1"); // Example sale price of 1 ETH

      // Mint a token first to check royalty info for it
      await teesaNft.mint(otherAccount.address, "ipfs://royaltytest");

      const [receiver, royaltyAmount] = await teesaNft.royaltyInfo(tokenId, salePrice);

      const expectedRoyaltyAmount = (salePrice * BigInt(royaltyFeeNumerator)) / 10000n;

      expect(receiver).to.equal(royaltyReceiver);
      expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
    });

     it("Should allow the owner to set default royalty", async function () {
      const { teesaNft, owner, otherAccount } = await loadFixture(deployNftFixture);
      const newReceiver = otherAccount.address;
      const newFeeNumerator = 1000; // 10%

      // Check that the function emits the correct event
      await expect(teesaNft.setDefaultRoyalty(newReceiver, newFeeNumerator))
        .to.emit(teesaNft, "DefaultRoyaltyUpdated")
        .withArgs(newReceiver, newFeeNumerator);

       const salePrice = ethers.parseEther("1");
       const tokenId = 0;
       await teesaNft.mint(owner.address, "ipfs://newroyalty"); // Mint after setting new royalty

      const [receiver, royaltyAmount] = await teesaNft.royaltyInfo(tokenId, salePrice);
       const expectedRoyaltyAmount = (salePrice * BigInt(newFeeNumerator)) / 10000n;

      expect(receiver).to.equal(newReceiver);
       expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
     });

     it("Should prevent non-owners from setting default royalty", async function () {
       const { teesaNft, otherAccount } = await loadFixture(deployNftFixture);
       const newReceiver = otherAccount.address;
       const newFeeNumerator = 1000;

       await expect(
         teesaNft.connect(otherAccount).setDefaultRoyalty(newReceiver, newFeeNumerator)
       ).to.be.revertedWithCustomError(teesaNft, "OwnableUnauthorizedAccount")
        .withArgs(otherAccount.address);
     });
  });
}); 