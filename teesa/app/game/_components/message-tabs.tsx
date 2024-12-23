'use client'

import { useState } from 'react'
import { Button } from "@/components/button"
import { cn } from '@/lib/utils'

export default function MessageTabs({
  className,
  showAllMessages,
  onTabChange
}: {
  className?: string,
  showAllMessages: boolean,
  onTabChange: any
}) {
  function handleClick(allMessages: boolean) {
    onTabChange(allMessages);
  }

  return (
    <div className={cn("w-fit mt-2 mx-auto inline-flex items-center justify-center rounded-lg bg-slate-800/50 border border-blue-500/30 p-1 text-slate-300", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick(true)}
        className={`relative rounded-md px-3 transition-all ${
          showAllMessages 
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm hover:opacity-90" 
            : "text-slate-300 hover:text-white"
        }`}
      >
        All messages
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick(false)}
        className={`relative rounded-md px-3 transition-all ${
          !showAllMessages 
            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm hover:opacity-90" 
            : "text-slate-300 hover:text-white"
        }`}
      >
        My messages
      </Button>
    </div>
  )
}

