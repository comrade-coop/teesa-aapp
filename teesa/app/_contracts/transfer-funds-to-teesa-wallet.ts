import { ConnectedWallet } from "@privy-io/react-auth";
import { getEnvironments } from "../_actions/get-environments";
import { parseEther } from "ethers";

export enum TransferFundsToTeesaWalletResult {
    Success,
    FailedInsufficientFunds,
    FailedWalletNotFound,
    FailedOtherError
}

export async function transferFundsToTeesaWallet(
    userWalletAddress: string,
    userWallets: ConnectedWallet[],
    amount: number
): Promise<TransferFundsToTeesaWalletResult> {
    const userWallet = userWallets.find(wallet => wallet.address == userWalletAddress);
    if (!userWallet) {
        console.error(`Wallet not found for address: ${userWalletAddress}`);
        return TransferFundsToTeesaWalletResult.FailedWalletNotFound;
    }

    const { chainId, teesaWalletAddress } = await getEnvironments();

    await userWallet.switchChain(chainId);

    const provider = await userWallet.getEthersProvider();
    const balance = await provider.getBalance(userWalletAddress);

    const amountInWei = parseEther(amount.toString());

    if (balance.lt(amountInWei)) {
        return TransferFundsToTeesaWalletResult.FailedInsufficientFunds;
    }

    try {
        const signer = await provider.getSigner();
        const transaction = await signer.sendTransaction({
            to: teesaWalletAddress,
            value: amountInWei
        });
        
        await provider.waitForTransaction(transaction.hash, 1);
        return TransferFundsToTeesaWalletResult.Success;
    } catch (error) {
        console.error("Error transferring funds:", error);
        return TransferFundsToTeesaWalletResult.FailedOtherError;
    }
}