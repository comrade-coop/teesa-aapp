'use client';

import { Button } from "@/components/button";

export default function Index() {
  function handleClick() {
    window.location.href ='/game';
  }

  return (
    <div className="absolute w-full top-0 bottom-0 flex items-center justify-center">
      <Button
        className="bg-slate-800 text-white shadow-sm hover:bg-slate-800 hover:text-white"
        onClick={handleClick}
      >
          Start
      </Button>
    </div>
  );
}