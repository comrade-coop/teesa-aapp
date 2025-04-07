'use client';

import { ClaimInterface } from '../_components/claim-interface';
import { withdrawTeamShare } from './_actions/withdraw-team-share';

export default function Page() {
  return (
    <ClaimInterface
      title="Withdraw Team Share"
      actionButtonText="Withdraw"
      onAction={withdrawTeamShare}
    />
  );
}