import path from 'path';
import { Readable } from 'stream';
import { imageToReadableStream, mintNft, pinata, urlToReadableStream } from "./nft-utils";
import { fal } from "@fal-ai/client";

require('dotenv').config({ path: path.resolve(process.cwd(), '../../../.env') });

async function generateNftImage(secretWord: string): Promise<Readable> {
  fal.config({
    credentials: process.env.FAL_API_KEY,
  });

  const stream = await fal.stream("workflows/todorkolev/teesa-nft", {
    input: {
      word: secretWord
    }
  });
  
  const result = await stream.done();
  const imageUrl = result.output.image.url;
  const imageStream = await urlToReadableStream(imageUrl);
  return imageStream;
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

export async function generateNft(userAddress: string, gameId: string, secretWord: string): Promise<string> {
  console.log("Generating NFT for user", userAddress);

  try {
    const imageStream = await generateNftImage(secretWord);
    const imageIpfsUrl = await uploadImageToIpfs(imageStream, gameId);
    const metadataIpfsUrl = await uploadMetadataToIpfs(imageIpfsUrl, userAddress, gameId, secretWord);
    const tokenId = await mintNft(userAddress, metadataIpfsUrl);

    console.log(`NFT generated successfully for user ${userAddress}. Token ID: ${tokenId.toString()}`);

    return tokenId.toString();
  } catch (error) {
    console.error("Error generating NFT:", error);
    throw error;
  }
}
