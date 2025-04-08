"use server";

import * as fs from 'fs';
import { Readable } from 'stream';
import path from 'path';
import PinataSDK from "@pinata/sdk";
import { gameState } from '@/app/_core/game-state';
import { mintNft } from '@/app/_contracts/mint-nft';

const TEESA_NFT_BASE_IMAGE_PATH = path.join(process.cwd(), 'assets', 'nft.png');

const pinata = () => {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataApiSecret = process.env.PINATA_API_SECRET;
  return new PinataSDK(pinataApiKey, pinataApiSecret);
}

async function imageToReadableStream(filePath: string): Promise<Readable> {
  return fs.createReadStream(filePath);
}

async function uploadImageToIpfs(inputStream: Readable): Promise<string> {
  const options: any = {
    pinataMetadata: {
      name: `Teesa - ${gameState.getId()} - image`,
    }
  };

  const result = await pinata().pinFileToIPFS(inputStream, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

async function uploadMetadataToIpfs(imageIpfsUrl: string, userAddress: string): Promise<string> {
  const nftMetadata = {
    "name": `Teesa NFT - ${gameState.getSecretWord()}`,
    "description": `Teesa NFT prize for word guessing game **${gameState.getId()}**. The secret word was **${gameState.getSecretWord()}**. The winner is **${userAddress}**.`,
    "image": imageIpfsUrl,
    "attributes": [
      {
        "trait_type": "Game ID",
        "value": gameState.getId()
      },
      {
        "trait_type": "Secret Word",
        "value": gameState.getSecretWord()
      },
      {
        "trait_type": "Winner Address",
        "value": userAddress
      }
    ]
  }
  
  const options: any = {
    pinataMetadata: {
      name: `Teesa - ${gameState.getId()} - metadata`,
    }
  };

  const result = await pinata().pinJSONToIPFS(nftMetadata, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

export async function generateNft(userAddress: string) {
  console.log("Generating NFT for user", userAddress);

  try {
    const imageStream = await imageToReadableStream(TEESA_NFT_BASE_IMAGE_PATH);
    const imageIpfsUrl = await uploadImageToIpfs(imageStream);
    const metadataIpfsUrl = await uploadMetadataToIpfs(imageIpfsUrl, userAddress);

    await mintNft(userAddress, metadataIpfsUrl);

    console.log("NFT generated successfully");
  } catch (error) {
    console.error("Error generating NFT:", error);
    throw error;
  }
}
