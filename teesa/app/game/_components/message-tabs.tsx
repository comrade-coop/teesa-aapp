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
    <div className={cn("w-fit mt-2 mx-auto inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick(true)}
        className={`relative rounded-md px-3 transition-none ${
          showAllMessages 
            ? "bg-slate-800 text-white shadow-sm hover:bg-slate-800 hover:text-white" 
            : "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
        }`}
      >
        All messages
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick(false)}
        className={`relative rounded-md px-3 transition-none ${
          !showAllMessages 
            ? "bg-slate-800 text-white shadow-sm hover:bg-slate-800 hover:text-white" 
            : "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
        }`}
      >
        My messages
      </Button>
    </div>
  )
}

