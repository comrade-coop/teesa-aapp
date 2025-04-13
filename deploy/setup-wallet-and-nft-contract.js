// In the Docker container we will copy this file and the NFT contract's ABI to the root directory, because we will be using this script in start.sh

import { ethers } from "ethers";
import { parseEther } from "ethers";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const WALLET_PRIVATE_KEY_FILE_NAME = 'wallet.key';
const FUNDS_TO_TRANSFER = parseEther('0.001');
const NFT_CONTRACT_ABI_FILE_PATH = path.join(process.cwd(), 'teesa-nft.json');

function getOrGenerateWallet(provider) {
  const cloudVolumePath = process.env.DOCKER_CLOUD_VOLUME_PATH;
  if (!cloudVolumePath) {
    throw new Error('DOCKER_CLOUD_VOLUME_PATH is not set');
  }

  let walletPrivateKey;

  const walletPrivateKeyFilePath = path.join(cloudVolumePath, WALLET_PRIVATE_KEY_FILE_NAME);

  if (existsSync(walletPrivateKeyFilePath)) {
    walletPrivateKey = readFileSync(walletPrivateKeyFilePath, 'utf8');
    console.log('Loading wallet from file.');
  } else {
    // Generate new wallet
    const newWallet = ethers.Wallet.createRandom();
    walletPrivateKey = newWallet.privateKey;

    // Save the private key to the file
    writeFileSync(walletPrivateKeyFilePath, walletPrivateKey);

    console.log('Generated new wallet.');
  }

  const wallet = new ethers.Wallet(walletPrivateKey, provider);
  console.log(`Wallet address: ${wallet.address}`);
  return wallet;
}

async function transferFundsFromInitialWallet(provider, initialWallet, wallet) {
  const balance = await provider.getBalance(wallet.address);

  // If the wallet already has funds, no need to transfer
  if (balance !== 0n) {
    console.log(`Wallet already has ${ethers.formatEther(balance.toString())} ETH, skipping transfer`);
    return;
  }

  const initialWalletBalance = await provider.getBalance(initialWallet.address);

  if (initialWalletBalance < FUNDS_TO_TRANSFER) {
    throw new Error(`Insufficient funds in the initial wallet. Initial wallet balance: ${ethers.formatEther(initialWalletBalance.toString())} ETH, required: ${ethers.formatEther(FUNDS_TO_TRANSFER.toString())} ETH`);
  }

  try {
    const transaction = await initialWallet.sendTransaction({
      to: wallet.address,
      value: FUNDS_TO_TRANSFER
    });
    
    await provider.waitForTransaction(transaction.hash, 1);
  } catch (error) {
    console.error("Error transferring funds from the initial wallet:", error);
    throw new Error('Error transferring funds from the initial wallet');
  }
}

async function transferNftContractOwnership(provider, initialWallet, wallet) {
  const nftContractAddress = process.env.DOCKER_NFT_CONTRACT_ADDRESS;
  if (!nftContractAddress) {
    throw new Error('DOCKER_NFT_CONTRACT_ADDRESS is not set');
  }

  const nftContractAbi = JSON.parse(readFileSync(NFT_CONTRACT_ABI_FILE_PATH, 'utf8'));
  const nftContract = new ethers.Contract(nftContractAddress, nftContractAbi.abi, initialWallet);

  const currentOwner = await nftContract.owner();
  if (currentOwner.toLowerCase() == wallet.address.toLowerCase()) {
    console.log('NFT contract already owned by the wallet');
    return;
  }

  try {
    const transaction = await nftContract.transferOwnership(wallet.address);
    await provider.waitForTransaction(transaction.hash, 1);
  } catch (error) {
    console.error("Error transferring NFT contract ownership:", error);
    throw new Error('Error transferring NFT contract ownership');
  }
}

(async () => {
  // On the Docker container we set the same value for all the RPC URLs environment variables, so we can use any of them
  const rpcUrl = process.env.RPC_URL_BASE;
  if (!rpcUrl) {
    throw new Error('RPC_URL_BASE is not set');
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const initialWalletPrivateKey = process.env.DOCKER_INITIAL_WALLET_PRIVATE_KEY;
  if (!initialWalletPrivateKey) {
    throw new Error('DOCKER_INITIAL_WALLET_PRIVATE_KEY is not set');
  }
  const initialWallet = new ethers.Wallet(initialWalletPrivateKey, provider);

  const wallet = getOrGenerateWallet();
  await transferFundsFromInitialWallet(provider, initialWallet, wallet);
  await transferNftContractOwnership(provider, initialWallet, wallet);
})();
