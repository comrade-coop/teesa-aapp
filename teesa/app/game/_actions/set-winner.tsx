import 'server-only';
import { executeContractActionServer } from '../../_contracts/execute-contract-action-server';

export async function setWinner(userAddress: string) {
  if (process.env.NEXT_PUBLIC_ENV_MODE === 'dev') {
    console.log('DEV MODE: Winner added:', userAddress);
    console.log('DEV MODE: Prize awarded');
    return;
  }

  const setWinnerResult = await executeContractActionServer('setWinner', [userAddress]);
  if(!setWinnerResult) {
    return;
  }
  
  console.log('Winner added:', userAddress);

  const awardPrizeResult = await executeContractActionServer('awardPrize', []);
  if(!awardPrizeResult) {
    return;
  }

  console.log('Prize awarded');
}