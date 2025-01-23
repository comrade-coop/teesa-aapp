import { ExternalLink } from 'lucide-react';

export function ContractInfo({
  prizePool,
  currentFee,
  contractAddress,
  chainId
}: {
  prizePool: string;
  currentFee: string;
  contractAddress: string | undefined;  
  chainId: number;
}) {
  const getExplorerInfo = () => {
    if (chainId === 8453) {
      return { url: 'https://basescan.org', name: 'Base' };
    }
    if (chainId === 11155111) {
      return { url: 'https://sepolia.etherscan.io', name: 'Sepolia Testnet' };
    }
    return { url: 'https://etherscan.io', name: 'EVM' };
  };

  const explorerInfo = getExplorerInfo();

  return (
    <div className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-blue-500/30">
      <div className="space-y-2">
        <div>
          <p className="text-sm text-slate-400">Prize Pool</p>
          <p className="text-lg font-medium">{prizePool} ETH</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Message Fee</p>
          <p className="text-lg font-medium">{currentFee} ETH</p>
        </div>
        {contractAddress && (
          <div>
            <a
              href={`${explorerInfo.url}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Contract on {explorerInfo.name}
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <div className="pt-4 border-t border-blue-500/30">
          <p className="text-sm text-slate-400 mb-2">How it works</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Message fee increases by 1% after each message</li>
            <li>• All fees go to the prize pool</li>
            <li>• Winner gets 70% of the prize pool</li>
            <li>• Teesa DAO receives 30%</li>
            <li className="pt-2 text-slate-400">If no activity for 3 days:</li>
            <li>• Last player gets at least 10%</li>
            <li>• Remaining prize split among players</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 