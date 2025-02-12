'use client';

import { redirect } from 'next/navigation';
import { getContractInitialized } from './_actions/get-contract-initiliazed';
import { useEffect, useState } from 'react';

export default function Page() {
  const [contractInitialized, setContractInitialized] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchContractInitialized = async () => {
      const initialized = await getContractInitialized();
      setContractInitialized(initialized);
    };
    fetchContractInitialized();
  }, []);

  if (contractInitialized == true) {
    redirect('/game');
  } else if (contractInitialized === false) {
    redirect('/init');
  }
  
  return (
    <div>
    </div>
  );
}