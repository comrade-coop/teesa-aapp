'use server';

import { callContractViewMethod } from "../../_contracts/call-contract-view-method";
import { ethers } from "ethers";
import { transferTeesaFundsToContract } from "./transfer-teesa-funds-to-contract";
import { Mutex } from 'async-mutex';

const transferMutex = new Mutex();
let transferExecuted = false;

export async function getContractInfo() {
    const [prizePool, currentFee, gameAbandoned] = await Promise.all([
        callContractViewMethod('prizePool'),
        callContractViewMethod('currentFee'),
        callContractViewMethod('abandonedGameTimeElapsed')
    ]);

    if (gameAbandoned) {
        await transferMutex.runExclusive(async () => {
            if (!transferExecuted) {
                transferTeesaFundsToContract();
                transferExecuted = true;
            }
        });
    }

    return {
        prizePool: Number(ethers.formatEther(prizePool)).toFixed(5),
        currentFee: Number(ethers.formatEther(currentFee)).toFixed(5),
        gameAbandoned: gameAbandoned
    };
}
