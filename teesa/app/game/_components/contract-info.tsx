import { ExternalLink } from 'lucide-react';
import { openExternalLink } from '@/lib/external-link-utils';

export function ContractInfo({
  prizePool,
  currentFee,
  prizePoolUsdc,
  currentFeeUsdc,
  contractAddress,
  chainId
}: {
  prizePool: string;
  currentFee: string;
  prizePoolUsdc: string;
  currentFeeUsdc: string;
  contractAddress: string | undefined;  
  chainId: number;
}) {
  // Format ETH values to 3 decimal places
  const formattedPrizePool = Number(prizePool).toFixed(3);
  const formattedCurrentFee = Number(currentFee).toFixed(3);

  const getExplorerInfo = () => {
    if (chainId === 8453) {
      return { url: 'https://basescan.org', name: 'Base' };
    }
    if (chainId === 11155111) {
      return { url: 'https://sepolia.etherscan.io', name: 'Sepolia Testnet' };
    }
    if (chainId === 84532) {
      return { url: 'https://sepolia.basescan.org', name: 'Base Sepolia Testnet' };
    }
    return { url: 'https://etherscan.io', name: 'EVM' };
  };

  const explorerInfo = getExplorerInfo();
  
  // Handle click events for the contract link
  const handleLinkClick = (e: any) => {
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      openExternalLink(e, href);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-blue-500/30">
      <div className="space-y-0">
        <div>
          <p className="text-sm text-slate-400 font-bold">Prize Pool</p>
          <p className="text-lg font-medium">{formattedPrizePool} ETH</p>
          <p className="text-sm text-slate-400">(≈ ${prizePoolUsdc} USDC)</p>
        </div>

        <div className="my-4 pt-4">
          <p className="text-sm text-slate-400 font-bold">Guess Fee</p>
          <p className="text-lg font-medium">{formattedCurrentFee} ETH</p>
          <p className="text-sm text-slate-400">(≈ ${currentFeeUsdc} USDC)</p>
        </div>
        
        {contractAddress && (
          <div className="my-4 pt-4">
            <a
              href={`${explorerInfo.url}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              onClick={handleLinkClick}
            >
              Contract on {explorerInfo.name}
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Add larger space before separator */}
        <div className="h-6"></div>
        
        {/* Flat separator */}
        <div className="border-t border-blue-500/30"></div>
        
        {/* Add equal larger space after separator */}
        <div className="h-6"></div>
        
        <div className="border-t-0 bg-slate-800/30 rounded-md">
          <p className="text-sm text-slate-400 mb-2">How it works</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Asking questions and chatting with Teesa is free</li>
            <li>• To make a guess, you pay a fee</li>
            <li>• The fee increases by 10% after each question</li>
            <li>• Winner gets 70% of the accumulated fees</li>
            <li>• 20% is sent to the prize pool of the next game</li>
            <li>• Teesa DAO receives 10%</li>
            <li className="pt-2 text-slate-400">If no activity for 7 days:</li>
            <li>• Last player gets at least 10%</li>
            <li>• Remaining prize split among players</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 