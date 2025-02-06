import { redirect } from 'next/navigation';
import { getContractInitialized } from './_actions/get-contract-initiliazed';

export default async function Page() {
  const contractInitialized = await getContractInitialized();

  if (contractInitialized) {
    redirect('/game');
  } else {
    redirect('/init');
  }
}