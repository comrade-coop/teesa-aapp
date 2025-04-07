'use server';

import { getNetwork } from "@teesa-monorepo/contracts/networks";

export async function getNetworkEnvironments() {
  const network = getNetwork();

  const rpcUrl = network.rpcUrl;
  const chainId = network.chainId;

  return { rpcUrl, chainId };
}
