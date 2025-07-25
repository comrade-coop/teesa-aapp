'use server';

import { getNetwork } from "@teesa-monorepo/nft/src/networks";

export async function getChainId() {
  const network = getNetwork();

  return network.chainId;
}
