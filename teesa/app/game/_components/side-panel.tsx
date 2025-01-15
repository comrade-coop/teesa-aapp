'use client';

import { Button } from "@/components/button";
import { Menu, LogOut, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  className
}: { 
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
  className?: string;
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
        <Menu className="h-6 w-6" />
      </Button>

      {/* Panel */}
      <div className={cn(`fixed top-0 right-0 bottom-0 w-full md:w-80
        bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30 
        p-6 z-40 transition-transform duration-300 transform flex flex-col
        ${!isDesktop && !isOpen ? 'translate-x-full' : 'translate-x-0'}`, className)}
      >
        <div className="flex-1">
          {children}
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