import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import GameContract from '../../_contracts/Game.json';
import { getEnvironments } from '../../_actions/get-environments';

export function ContractInfo() {
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');

  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        const { gameContractAddress, rpcUrl } = await getEnvironments();
        if (!gameContractAddress || !rpcUrl) {
          console.error('Missing contract address or RPC URL');
          return;
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(gameContractAddress, GameContract.abi, provider);

        const [prizePoolBN, currentFeeBN] = await Promise.all([
          contract.prizePool(),
          contract.currentFee()
        ]);

        setPrizePool(ethers.formatEther(prizePoolBN));
        setCurrentFee(ethers.formatEther(currentFeeBN));
      } catch (error) {
        console.error('Error fetching contract info:', error);
      }
    };

    fetchContractInfo();
    const interval = setInterval(fetchContractInfo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-blue-500/30">
      <h3 className="text-lg font-semibold text-blue-400">Game Info</h3>
      <div className="space-y-2">
        <div>
          <p className="text-sm text-slate-400">Prize Pool</p>
          <p className="text-lg font-medium">{prizePool} ETH</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Current Fee</p>
          <p className="text-lg font-medium">{currentFee} ETH</p>
        </div>
      </div>
    </div>
  );
} 