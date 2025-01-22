import { useEffect, useState } from 'react';
import { getContractInfo } from '../_actions/get-contract-info';
import { getEnvironments } from '../../_actions/get-environments';
import { ExternalLink } from 'lucide-react';

export function ContractInfo() {
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string>('');

  useEffect(() => {
    const fetchContractInfo = async () => {
      try {
        const { prizePool, currentFee } = await getContractInfo();
        const { gameContractAddress } = await getEnvironments();

        setPrizePool(prizePool);
        setCurrentFee(currentFee);
        setContractAddress(gameContractAddress || '');
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
        {contractAddress && (
          <div>
            <p className="text-sm text-slate-400">Contract</p>
            <a
              href={`https://basescan.org/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View on Basescan
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-blue-500/30">
          <p className="text-sm text-slate-400 mb-2">How it works</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Next message costs {currentFee} ETH</li>
            <li>• Message fee increases by 1% after each message</li>
            <li>• All fees go to the prize pool</li>
            <li>• Winner gets 70% of the prize pool</li>
            <li>• Teesa DAO receives 30%</li>
            <li className="pt-2 text-slate-400">If no activity for 3 days:</li>
            <li>• Last player gets 10% or more</li>
            <li>• Remaining prize split among players</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 