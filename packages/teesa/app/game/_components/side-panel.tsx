'use client';

import { Button } from "@/components/button";
import { Menu, LogOut, X, ShieldCheck, Wallet, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  chainId,
  className
}: {
  isLoggedIn: boolean;
  onLogout: () => void;
  chainId: number;
  className?: string;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  const nftContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

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

  const explorerInfo = () => {
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
      <div className={cn(`fixed top-0 right-0 bottom-0 w-full md:w-80 bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30 p-6 z-40 transition-transform duration-300 transform flex flex-col overflow-y-auto ${!isDesktop && !isOpen ? 'translate-x-full' : 'translate-x-0'}`, className)}>
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
          </div>
        </div>

        {isLoggedIn && (
          <Button
            variant="ghost"
            className="w-full text-red-400 hover:text-red-300"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}

        <div className="mt-2">
          <a
            href={`${explorerInfo().url}/address/${nftContractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            NFT Contract on {explorerInfo().name}
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

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