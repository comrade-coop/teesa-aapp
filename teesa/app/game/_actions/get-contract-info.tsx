'use server';

import { callContractViewMethod } from "../../_contracts/call-contract-view-method";
import { ethers } from "ethers";
import { Mutex } from 'async-mutex';
import { restartGame } from "./restart-game";

const restartGameMutex = new Mutex();
let restartGameExecuted = false;

// Function to get ETH price in USD from CoinGecko
async function getEthToUsdPrice(): Promise<number> {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
            { next: { revalidate: 60 } } // Cache for 60 seconds
        );
        
        if (!response.ok) {
            console.error('Failed to fetch ETH price:', response.statusText);
            return 0;
        }
        
        const data = await response.json();
        return data.ethereum.usd;
    } catch (error) {
        console.error('Error fetching ETH price:', error);
        return 0;
    }
}

export async function getContractInfo() {
    const [prizePool, currentFee, gameAbandoned] = await Promise.all([
        callContractViewMethod('prizePool'),
        callContractViewMethod('currentFee'),
        callContractViewMethod('gameAbandoned')
    ]);

    if (gameAbandoned) {
        await restartGameMutex.runExclusive(async () => {
            if (!restartGameExecuted) {
                restartGame()
                restartGameExecuted = true;
            }
        });
    }

    // Format ETH values
    const prizePoolEth = Number(ethers.formatEther(prizePool)).toFixed(5);
    const currentFeeEth = Number(ethers.formatEther(currentFee)).toFixed(5);
    
    // Get ETH to USD conversion rate
    const ethPrice = await getEthToUsdPrice();
    
    // Calculate USDC values (USDC is pegged to USD)
    const prizePoolUsdc = ethPrice > 0 
        ? (Number(prizePoolEth) * ethPrice).toFixed(2) 
        : '0.00';
    const currentFeeUsdc = ethPrice > 0 
        ? (Number(currentFeeEth) * ethPrice).toFixed(2) 
        : '0.00';

    return {
        prizePool: prizePoolEth,
        currentFee: currentFeeEth,
        prizePoolUsdc,
        currentFeeUsdc,
        gameAbandoned: gameAbandoned
    };
}
