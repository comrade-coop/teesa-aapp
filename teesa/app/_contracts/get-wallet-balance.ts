import { ConnectedWallet } from "@privy-io/react-auth";
import { BigNumber} from "@ethersproject/bignumber";
import { getEnvironments } from "../_actions/get-environments";

export async function getWalletBalance(
    walletAddress: string, 
    wallets: ConnectedWallet[]
  ): Promise<BigNumber | undefined> {
    const wallet = wallets.find(wallet => wallet.address == walletAddress);
    if (!wallet) {
      console.error(`Wallet not found for address: ${walletAddress}`);
      return undefined;
    }
  
    const { chainId } = await getEnvironments();
    await wallet.switchChain(chainId);
  
    const provider = await wallet.getEthersProvider();
    const balance = await provider.getBalance(walletAddress);

    return balance;
  } 