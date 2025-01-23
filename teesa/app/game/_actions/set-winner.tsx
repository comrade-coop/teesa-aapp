import 'server-only';
import { executeContractActionServer } from '@/app/_contracts/execute-contract-action-server';

export async function setWinner(userAddress: string) {
  const setWinnerResult = await executeContractActionServer('setWinner', [userAddress]);
  if(!setWinnerResult) {
    return;
  }
  
  console.log('Winner added:', userAddress);

  const awardPrizeResult = await executeContractActionServer('awardPrize', []);
  if(!awardPrizeResult) {
    return;
  }

  console.log('Prizes awarded');
}