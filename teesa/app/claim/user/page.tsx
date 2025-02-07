'use client';

import { ClaimInterface } from '../_components/claim-interface';
import { claimAbandonedGameShare } from './_actions/claim-abandoned-game-share';

export default function Page() {
  return (
    <ClaimInterface
      title="Claim Your Share"
      actionButtonText="Claim Share"
      onAction={claimAbandonedGameShare}
    />
  );
} 