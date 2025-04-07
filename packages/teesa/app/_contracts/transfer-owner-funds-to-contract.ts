import 'server-only';
import { ethers } from "ethers";
import GameContract from './abi/Game.json';
import { getEnv } from '@/lib/environments';

export async function transferOwnerFundsToContract() {
    console.log('Transferring owner funds to contract');

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

    const balance = await provider.getBalance(wallet.address);
    if (balance === BigInt(0)) {
        throw new Error('No balance to transfer');
    }

    // Get EIP-1559 fee data
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas!;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;

    const gasLimit = await gameContract.transferOwnerFundsToContract.estimateGas({
        value: BigInt(1),  // Use minimal value for estimation
        maxFeePerGas,
        maxPriorityFeePerGas
    });

    // Calculate total gas cost once
    const totalGasCost = gasLimit * maxFeePerGas;
    const amountToSend = balance - totalGasCost;

    console.log('Total gas cost:', totalGasCost);

    if (amountToSend <= BigInt(0)) {
        throw new Error('Not enough balance to transfer after gas costs');
    }

    try {
        const transaction = await gameContract.transferOwnerFundsToContract({
            value: amountToSend,
            gasLimit: gasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas
        });
        
        await provider.waitForTransaction(transaction.hash, 1);
        console.log('Funds transferred to contract successfully');
    } catch (error) {
        console.error('Error transferring funds to contract:', error);
        throw error;
    }
}