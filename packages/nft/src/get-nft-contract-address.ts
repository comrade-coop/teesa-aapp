export function getNftContractAddress() {
    const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;
    if (!nftContractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS environment variable is not set');
    }

    return nftContractAddress;
}
