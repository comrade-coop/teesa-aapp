import { ethers } from "ethers";
import { getEnvironments } from "../_actions/get-environments";
import GameContract from './abi/Game.json';

export async function callContractViewMethod(contractMethod: string): Promise<any> {
    const { gameContractAddress, rpcUrl } = await getEnvironments();

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(gameContractAddress!, GameContract.abi, provider);

    return contract[contractMethod]();
}