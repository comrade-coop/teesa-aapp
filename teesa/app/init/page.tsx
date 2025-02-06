'use client';

import { deployContract } from "./_actions/deploy-contract";

export default function Page() {

  async function onClick() {
    const response = await deployContract();
  }

  return (
    <div>
      <button onClick={onClick}>Init</button>
    </div>
  );
} 