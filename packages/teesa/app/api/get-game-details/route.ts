import { callContractViewMethod } from "@/app/_contracts/call-contract-view-method";
import { gameState } from "../../_core/game-state";
import { calculateCurrentFee } from "../../game/_actions/calculate-current-fee";
import { ethers } from "ethers";
import { getEnv } from "@/lib/environments";

interface GameDetails {
    contractAddress: string;
    initialFee: string;
    currentFee: string;
    prizePool: string;
    gameAbandoned: boolean;
    winnerAddress: string | undefined;
}

export async function GET(request: Request) {
    const contractAddress = getEnv('GAME_CONTRACT_ADDRESS');
    const initialFee = await callContractViewMethod('initialFee');
    const currentFee = await calculateCurrentFee();
    const prizePool = await callContractViewMethod('prizePool');
    const gameAbandoned = await callContractViewMethod('gameAbandoned');
    const winnerAddress = await gameState.getWinnerAddress();

    const initialFeeEth = Number(ethers.formatEther(initialFee)).toFixed(5);
    const currentFeeEth = Number(ethers.formatEther(currentFee)).toFixed(5);
    const prizePoolEth = Number(ethers.formatEther(prizePool)).toFixed(5);
    
    const result: GameDetails = {
        contractAddress: contractAddress ?? '',
        initialFee: initialFeeEth,
        currentFee: currentFeeEth,
        prizePool: prizePoolEth,
        gameAbandoned: gameAbandoned,
        winnerAddress: winnerAddress,
    }
    
    return Response.json(result);
}