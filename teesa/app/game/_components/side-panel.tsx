'use client';

import { Button } from "@/components/button";
import { Menu, LogOut, X, ShieldCheck, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ContractInfo } from "./contract-info";
import { openExternalLink } from "@/lib/external-link-utils";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function SidePanel({
  isLoggedIn = false, 
  onLogout,
  prizePool,
  currentFee,
  prizePoolUsdc,
  currentFeeUsdc,
  contractAddress,
  chainId,
  className
}: {
  isLoggedIn: boolean;
  onLogout: () => void;
  className?: string;
  prizePool: string;
  currentFee: string;
  prizePoolUsdc: string;
  currentFeeUsdc: string;
  contractAddress: string | undefined;
  chainId: number;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  useEffect(() => {
    setIsOpen(isDesktop);
  }, [isDesktop]);
  
  // Handle TEE secured link
  const handleTeeSecuredClick = (e: any) => {
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      openExternalLink(e, href);
    }
  };
  
  // Handle social media links
  const handleSocialLinkClick = (e: any) => {
    const href = e.currentTarget.getAttribute('href');
    if (href) {
      openExternalLink(e, href);
    }
  };

  const handleWalletClick = () => {
    setShowDisconnectDialog(true);
  };

  const handleDialogClose = () => {
    setShowDisconnectDialog(false);
  };

  const handleConfirmDisconnect = () => {
    setShowDisconnectDialog(false);
    onLogout();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 md:hidden z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Panel */}
      <div className={cn(`fixed top-0 right-0 bottom-0 w-full md:w-80
        bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30 
        p-6 z-40 transition-transform duration-300 transform flex flex-col overflow-y-auto
        ${!isDesktop && !isOpen ? 'translate-x-full' : 'translate-x-0'}`, className)}
      >
        <div className="flex-1 space-y-6">
          <div className="flex justify-center">
            <a
              href={process.env.NEXT_PUBLIC_ATTESTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group relative"
              onClick={handleTeeSecuredClick}
            >
              <div className="absolute inset-0 bg-blue-400/5 blur-xl rounded-full"></div>
              <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors relative" />
              <span className="text-sm font-medium relative flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent border-b border-blue-400/50 group-hover:border-blue-300 leading-none transition-colors">
                  TEE secured
                </span>
                <span className="flex gap-1 items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors animate-ping absolute"></span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors relative"></span>
                </span>
              </span>
            </a>
          </div>
          
          {isLoggedIn && (
            <div className="flex justify-center">
              <div 
                className="flex items-center gap-2 group relative cursor-pointer" 
                onClick={handleWalletClick}
              >
                <div className="absolute inset-0 bg-cyan-700/5 blur-xl rounded-full"></div>
                <Wallet className="w-5 h-5 text-cyan-700 group-hover:text-cyan-600 transition-colors relative" />
                <span className="text-sm font-medium relative flex items-center gap-2">
                  <span className="bg-gradient-to-r from-cyan-700 to-cyan-600 bg-clip-text text-transparent border-b border-cyan-700/30 group-hover:border-cyan-600/30 leading-none transition-colors">
                    Wallet connected
                  </span>
                  <span className="flex gap-1 items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-700 group-hover:bg-cyan-600 transition-colors animate-ping absolute opacity-50"></span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-700 group-hover:bg-cyan-600 transition-colors relative"></span>
                  </span>
                </span>
              </div>
            </div>
          )}
          
          <ContractInfo 
            prizePool={prizePool}
            currentFee={currentFee}
            prizePoolUsdc={prizePoolUsdc}
            currentFeeUsdc={currentFeeUsdc}
            contractAddress={contractAddress}
            chainId={chainId}
          />
          
          <h2 className="text-xl font-bold mb-4 text-white">Rules</h2>
          <div className="space-y-4">
            <div>
              <ul className="list-disc list-inside space-y-2">
                <li>Ask <span className="font-bold">yes/no</span> questions about the word</li>
                <li>Questions should be about characteristics or properties</li>
                <li>Make a direct guess at any time</li>
                <li>No asking about spelling or word length</li>
                <li>No repeating questions</li>
                <li>You can ask questions about the word to help you guess it</li>
                <li>When guessing, start with an explicit statement like "My guess is..." or "The word is..."</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-b border-blue-500/30 py-4 my-4">
          <div className="flex justify-center space-x-6">
            <a
              href="https://x.com/teesa_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
              onClick={handleSocialLinkClick}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/comrade-coop/teesa-aapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400 transition-colors"
              onClick={handleSocialLinkClick}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            {/* <a
              href="https://discord.gg/qKCCuSxK5m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-indigo-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a> */}
          </div>
        </div>

        {isLoggedIn && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-red-400 hover:text-red-300"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>

      {/* Wallet disconnect dialog */}
      {showDisconnectDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-cyan-700/30 p-6 rounded-lg max-w-xs w-full">
            <h3 className="text-lg font-medium text-white mb-3">Disconnect Wallet</h3>
            <p className="text-slate-300 text-sm mb-5">Are you sure you want to disconnect your wallet?</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={handleDialogClose}
                className="text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDisconnect}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {!isDesktop && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 