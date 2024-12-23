'use client';

import { Button } from "@/components/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export function RulesPanel({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

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
      <div className={`fixed md:relative md:w-80 top-0 right-0 bottom-0 left-0 md:left-auto 
        bg-slate-800/95 md:bg-slate-800/50 backdrop-blur-sm border-l border-blue-500/30 
        p-6 z-40 transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        {children}
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