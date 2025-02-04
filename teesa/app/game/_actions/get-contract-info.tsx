'use server';

import { callContractViewMethod } from "@/app/_contracts/call-contract-view-method";
import { ethers } from "ethers";

export async function getContractInfo() {
    const [prizePool, currentFee, gameAbandoned] = await Promise.all([
        callContractViewMethod('prizePool'),
        callContractViewMethod('currentFee'),
        callContractViewMethod('abandonedGameTimeElapsed')
    ]);

    return {
        prizePool: Number(ethers.formatEther(prizePool)).toFixed(5),
        currentFee: Number(ethers.formatEther(currentFee)).toFixed(5),
        gameAbandoned: gameAbandoned
    };
}
