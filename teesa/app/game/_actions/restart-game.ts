import { compile } from "@/app/_contracts/compile";
import { deploy } from '@/app/_contracts/deploys';
import { setEnv } from "@/lib/environments";
import { retryWithExponentialBackoff } from "@/lib/server-utils";
import "server-only";
import { executeContractActionServer } from "../../_contracts/execute-contract-action-server";
import { resetState } from "../../_core/game-state";
/*
* Restart game flow:
* 1. Send team share
* 2. Deploy new contract
* 3. Send next game share
* 4. Reset game state
*/

let newContractAddress: string | undefined = undefined;

export function restartGame() {
    newContractAddress = undefined;

    if(process.env.NEXT_PUBLIC_ENV_MODE === 'dev') {
        console.log('DEV MODE: Starting restart game flow in 10 seconds');
        setTimeout(() => {
            console.log('DEV MODE: Restarting game');

            // Used to test the changing of the contract address and the game page reload
            // console.log(`Current contract address: ${getEnv('GAME_CONTRACT_ADDRESS')}`);
            // newContractAddress = '0xE847f238F96316Cc9995eDD3A2ECF1e8164725cE';
            
            resetGameState();
        }, 10 * 1000); // 10 seconds

        return;
    }

    console.log('Starting restart game flow in 10 minutes');

    // Timeout before starting
    setTimeout(() => {
        console.log('Restarting game');
        sendTeamShare();
    }, 10 * 60 * 1000); // 10 minutes
}

function sendTeamShare() {
    console.log('Sending team share');
    retryWithExponentialBackoff(
        () => executeContractActionServer('sendTeamShare', []),
        () => deployNewContract()
    );
}

async function deployNewContract() {
    console.log('Deploying new contract');
    retryWithExponentialBackoff(
        () => compileAndDeployContract(),
        () => sendNextGameShareToContract()
    );
}

async function compileAndDeployContract() {
    await compile();
    newContractAddress = await deploy();
}

async function sendNextGameShareToContract() {
    console.log('Sending next game share to contract');
    retryWithExponentialBackoff(
        () => executeContractActionServer('sendNextGameShare', [newContractAddress]),
        () => resetGameState()
    );
}

async function resetGameState() {
    console.log('Resetting game state');
    await resetState();

    if(newContractAddress != undefined) {
        setEnv('GAME_CONTRACT_ADDRESS', newContractAddress);
        newContractAddress = undefined;
    }

    console.log('Game restarted successfully');
}

