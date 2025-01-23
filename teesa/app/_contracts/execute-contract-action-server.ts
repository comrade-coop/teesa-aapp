import 'server-only';
import { ethers } from "ethers";
import GameContract from './abi/Game.json';

export async function executeContractActionServer(
    contractMethod: string,
    params: any[],
    errorMessage?: string
): Promise<boolean> {
    if (!errorMessage) {
        errorMessage = `Error executing contract action: ${contractMethod}`;
    }

    if (!process.env.RPC_URL) {
        throw new Error('RPC_URL environment variable is not set');
    }

    if (!process.env.WALLET_PRIVATE_KEY) {
        throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
    }

    if (!process.env.GAME_CONTRACT_ADDRESS) {
        throw new Error('GAME_CONTRACT_ADDRESS environment variable is not set');
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
    
    const gameContract = new ethers.Contract(
        process.env.GAME_CONTRACT_ADDRESS!,
        GameContract.abi,
        wallet
    );

    try {
        const transaction = await gameContract[contractMethod](...params);
        await provider.waitForTransaction(transaction.hash, 1);
        return true;
      } catch (error) {
        console.error(errorMessage, error);
        return false;
      }
}