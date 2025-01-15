'use server';

import { ethers } from "ethers";
import GameContract from '../../_contracts/Game.json';

export async function getContractInfo() {
    const gameContractAddress = process.env.GAME_CONTRACT_ADDRESS;
    const rpcUrl = process.env.RPC_URL;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(gameContractAddress!, GameContract.abi, provider);

    const [prizePoolBN, currentFeeBN] = await Promise.all([
        contract.prizePool(),
        contract.currentFee()
    ]);

    return {
        prizePool: Number(ethers.formatEther(prizePoolBN)).toFixed(5),
        currentFee: Number(ethers.formatEther(currentFeeBN)).toFixed(5)
    };
}