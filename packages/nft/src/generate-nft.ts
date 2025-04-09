import PinataSDK from "@pinata/sdk";
import { ethers } from 'ethers';
import * as fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import TeesaNftAbi from "../abi/teesa-nft.json";
import { getNetwork } from './networks';

const TEESA_NFT_BASE_IMAGE_PATH = path.resolve(process.cwd(), '../nft/assets/nft.png');

const pinata = () => {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataApiSecret = process.env.PINATA_API_SECRET;
  return new PinataSDK(pinataApiKey, pinataApiSecret);
}

async function imageToReadableStream(filePath: string): Promise<Readable> {
  return fs.createReadStream(filePath);
}

async function uploadImageToIpfs(inputStream: Readable, gameId: string): Promise<string> {
  const options: any = {
    pinataMetadata: {
      name: `Teesa - ${gameId} - image`,
    }
  };

  const result = await pinata().pinFileToIPFS(inputStream, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

async function uploadMetadataToIpfs(imageIpfsUrl: string, userAddress: string, gameId: string, secretWord: string): Promise<string> {
  const nftMetadata = {
    "name": `Teesa NFT - ${secretWord}`,
    "description": `Teesa NFT prize for word guessing game **${gameId}**. The secret word was **${secretWord}**. The winner is **${userAddress}**.`,
    "image": imageIpfsUrl,
    "attributes": [
      {
        "trait_type": "Game ID",
        "value": gameId
      },
      {
        "trait_type": "Secret Word",
        "value": secretWord
      },
      {
        "trait_type": "Winner Address",
        "value": userAddress
      }
    ]
  }

  const options: any = {
    pinataMetadata: {
      name: `Teesa - ${gameId} - metadata`,
    }
  };

  const result = await pinata().pinJSONToIPFS(nftMetadata, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

async function mintNft(userAddress: string, metadataIpfsUrl: string) {
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  if (!walletPrivateKey) {
    throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
  }
  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
  if (!nftContractAddress) {
    throw new Error('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS environment variable is not set');
  }

  const network = getNetwork();

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(walletPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, TeesaNftAbi.abi, wallet);

  try {
    const transaction = await contract.mint(userAddress, metadataIpfsUrl);
    await provider.waitForTransaction(transaction.hash, 1);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function generateNft(userAddress: string, gameId: string, secretWord: string) {
  console.log("Generating NFT for user", userAddress);

  try {
    const imageStream = await imageToReadableStream(TEESA_NFT_BASE_IMAGE_PATH);
    const imageIpfsUrl = await uploadImageToIpfs(imageStream, gameId);
    const metadataIpfsUrl = await uploadMetadataToIpfs(imageIpfsUrl, userAddress, gameId, secretWord);

    await mintNft(userAddress, metadataIpfsUrl);

    console.log("NFT generated successfully");
  } catch (error) {
    console.error("Error generating NFT:", error);
    throw error;
  }
}
