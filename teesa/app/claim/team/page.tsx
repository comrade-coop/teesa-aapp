'use client';

import { ClaimInterface } from '../_components/claim-interface';
import { withdrawShare } from './_actions/withdraw-share';

export default function Page() {
  return (
    <ClaimInterface
      title="Withdraw Team Share"
      actionButtonText="Withdraw"
      onAction={withdrawShare}
    />
  );
}