import "server-only";
import { BigNumber } from "@ethersproject/bignumber";
import { getEnv } from "@/lib/environments";
import { getNetwork } from "@teesa-monorepo/contracts/networks";
import { ethers } from "ethers";

export async function getWalletAddressAndBalance(): Promise<{ address: string, balance: BigNumber }> {
  const walletPrivateKey = getEnv('WALLET_PRIVATE_KEY');
  if (!walletPrivateKey) {
    throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
  }

  const wallet = new ethers.Wallet(walletPrivateKey);
  const walletAddress = wallet.address;

  const network = getNetwork();

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const balance = await provider.getBalance(walletAddress);

  return { address: walletAddress, balance: BigNumber.from(balance) };
} 