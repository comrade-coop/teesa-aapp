import 'server-only';
import { ethers } from "ethers";
import GameContract from './abi/Game.json';
import { getEnv } from '@/lib/environments';

export async function executeContractActionServer(
    contractMethod: string,
    params: any[],
    errorMessage?: string
) {
    if (!errorMessage) {
        errorMessage = `Error executing contract action: ${contractMethod}`;
    }

    if (!getEnv('RPC_URL')) {
        throw new Error('RPC_URL environment variable is not set');
    }

    if (!getEnv('WALLET_PRIVATE_KEY')) {
        throw new Error('WALLET_PRIVATE_KEY environment variable is not set');
    }

    if (!getEnv('GAME_CONTRACT_ADDRESS')) {
        throw new Error('GAME_CONTRACT_ADDRESS environment variable is not set');
    }

    const provider = new ethers.JsonRpcProvider(getEnv('RPC_URL'));
    const wallet = new ethers.Wallet(getEnv('WALLET_PRIVATE_KEY')!, provider);

    const gameContract = new ethers.Contract(
        getEnv('GAME_CONTRACT_ADDRESS')!,
        GameContract.abi,
        wallet
    );

    try {
        const transaction = await gameContract[contractMethod](...params);
        await provider.waitForTransaction(transaction.hash, 1);
    } catch (error) {
        console.error(errorMessage, error);
        throw error;
    }
}