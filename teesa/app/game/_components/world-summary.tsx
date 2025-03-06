'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorldSummary({
  summary,
  className
}: {
  summary: string;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn('bg-slate-800/80 backdrop-blur-sm border border-blue-500/30 rounded-lg overflow-hidden shadow-lg', className)}>
      <div className="w-full flex items-center justify-between p-3 text-white">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-blue-300 transition-colors flex-grow text-left"
        >
          <BookOpen className="h-4 w-4 text-blue-400" />
          <span className="font-medium text-sm">Word Summary</span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-blue-400 ml-1" />
          ) : (
            <ChevronUp className="h-4 w-4 text-blue-400 ml-1" />
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-3 border-t border-blue-500/30 text-white max-h-[150px] overflow-y-auto">
          {summary ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="whitespace-pre-line text-sm">{summary}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic text-xs">No information about the word yet. The summary will update automatically as you play.</p>
          )}
        </div>
      )}
    </div>
  );
} 