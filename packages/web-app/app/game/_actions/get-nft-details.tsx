'use server';

import { getNetwork } from "@teesa-monorepo/nft/src/networks";
import { getNftContractAddress } from "@teesa-monorepo/nft/src/get-nft-contract-address";

export async function getNftDetails() {
  const network = getNetwork();
  const contractAddress = getNftContractAddress();

  return {
    name: network.displayName,
    explorerUrl: `${network.explorerUrl}/address/${contractAddress}`,
    openseaUrl: `${network.openseaUrl}/${contractAddress}`,
  };
}