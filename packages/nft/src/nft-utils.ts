import PinataSDK from "@pinata/sdk";
import { ethers } from 'ethers';
import * as fs from 'fs';
import { Readable } from 'stream';
import TeesaNftAbi from "../abi/teesa-nft.json";
import { getNetwork } from './networks';
import path from "path";
import fetch from 'node-fetch';

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

export const pinata = () => {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataApiSecret = process.env.PINATA_API_SECRET;
  return new PinataSDK(pinataApiKey, pinataApiSecret);
}

export async function imageToReadableStream(filePath: string): Promise<Readable> {
  return fs.createReadStream(filePath);
}

export async function urlToReadableStream(url: string): Promise<Readable> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${url}, status: ${response.status}`);
  }
  return response.body as Readable;
}

export async function mintNft(userAddress: string, metadataIpfsUrl: string) {
  const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
  if (!walletPrivateKey) {
    throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
  }
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!nftContractAddress) {
    throw new Error('NFT_CONTRACT_ADDRESS environment variable is not set');
  }

  const network = getNetwork();

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(walletPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, TeesaNftAbi.abi, wallet);

  try {
    const transaction: ethers.TransactionResponse = await contract.mint(userAddress, metadataIpfsUrl);
    const receipt = await transaction.wait(1);

    // Find the Transfer event in the transaction logs
    const transferEvent = receipt?.logs?.find(log => {
      try {
        const parsedLog = contract.interface.parseLog(log as any); // Use 'as any' for flexibility
        // Check for Transfer event signature and recipient
        return parsedLog?.name === 'Transfer' &&
          parsedLog?.args.to === userAddress &&
          parsedLog?.args.from === ethers.ZeroAddress;
      } catch (e) {
        // Ignore logs that don't match the ABI
        return false;
      }
    });

    if (!transferEvent) {
      throw new Error('Transfer event not found in transaction logs.');
    }

    // Parse the log again to get structured arguments
    const parsedLog = contract.interface.parseLog(transferEvent as any);
    const tokenId = parsedLog?.args.tokenId;

    if (tokenId === undefined) {
      throw new Error('Could not extract tokenId from Transfer event.');
    }

    return tokenId as ethers.BigNumberish; // Return the BigNumberish tokenId
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
}