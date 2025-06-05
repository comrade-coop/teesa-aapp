'use server';

import { getNetwork } from "@teesa-monorepo/nft/src/networks";

export async function getBlockchainNameAndExplorerUrl() {
  const network = getNetwork();

  return {
    name: network.displayName,
    explorerUrl: network.explorerUrl
  };
}