'use client';

import { Button } from "@/components/button";
import { Menu, LogOut, X } from "lucide-react";
import { useState } from "react";

export function SidePanel({ 
  children, 
  isLoggedIn = false, 
  onLogout 
}: { 
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

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

      {/* Desktop Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex fixed top-4 right-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-full md:w-80
        bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30 
        p-6 z-40 transition-transform duration-300 transform flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
} 