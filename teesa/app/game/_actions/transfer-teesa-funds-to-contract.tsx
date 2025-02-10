import { retryWithExponentialBackoff } from '@/lib/server-utils';
import 'server-only';
import { transferOwnerFundsToContract } from '../../_contracts/transfer-owner-funds-to-contract';

export function transferTeesaFundsToContract() {
    if (process.env.NEXT_PUBLIC_ENV_MODE === 'dev') {
        console.log('DEV MODE: Teesa funds transferred to contract');
        return;
    }

    console.log('Transferring Teesa funds to contract');

    retryWithExponentialBackoff(
        () => transferOwnerFundsToContract()
    );
}