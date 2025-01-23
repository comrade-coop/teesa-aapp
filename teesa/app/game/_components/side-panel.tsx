'use client';

import { Button } from "@/components/button";
import { Menu, LogOut, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ContractInfo } from "./contract-info";

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
  children, 
  isLoggedIn = false, 
  onLogout,
  prizePool,
  currentFee,
  contractAddress,
  className
}: { 
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
  className?: string;
  prizePool: string;
  currentFee: string;
  contractAddress: string | undefined;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isDesktop);
  }, [isDesktop]);

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
          <ContractInfo 
            prizePool={prizePool}
            currentFee={currentFee}
            contractAddress={contractAddress}
          />
          {children}
        </div>
        
        <div className="border-t border-b border-blue-500/30 py-4 my-4">
          <div className="flex justify-center space-x-6">
            <a
              href="https://x.com/teesa_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.gg/qKCCuSxK5m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-indigo-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
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