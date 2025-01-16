import { useEffect, useState } from 'react';
import { getContractInfo } from '../_actions/get-contract-info';

export function ContractInfo() {
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');

  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        const { prizePool, currentFee } = await getContractInfo();

        setPrizePool(prizePool);
        setCurrentFee(currentFee);
      } catch (error) {
        console.error('Error fetching contract info:', error);
      }
    };

    fetchContractInfo();
    const interval = setInterval(fetchContractInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-blue-500/30">
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