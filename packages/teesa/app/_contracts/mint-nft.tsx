import "server-only";
import { getNetwork } from "@teesa-monorepo/contracts/networks";
import { ethers } from "ethers";
import TeesaNftAbi from "@teesa-monorepo/contracts/abi/teesa-nft.json";

export async function mintNft(userAddress: string, metadataIpfsUrl: string) {
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