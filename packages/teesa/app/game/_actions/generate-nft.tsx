import "server-only";

export async function generateNft(userAddress: string) {
  console.log("Generating NFT for user", userAddress);

  await new Promise(resolve => setTimeout(resolve, 10000));
}
