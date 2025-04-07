import { buildModule } from "@nomicfoundation/ignition-core";

require('dotenv').config();

const TeesaNftModule = buildModule("TeesaNftModule", (m: any) => {
  const teamAddress = process.env.TEAM_ADDRESS;
  const nftName = process.env.NFT_NAME;
  const nftSymbol = process.env.NFT_SYMBOL;
  const royaltyFeeNumeratorStr = process.env.ROYALTY_FEE_NUMERATOR;

  if (!teamAddress) {
    throw new Error("TEAM_ADDRESS environment variable is not set");
  }
  if (!nftName) {
    throw new Error("NFT_NAME environment variable is not set");
  }
  if (!nftSymbol) {
    throw new Error("NFT_SYMBOL environment variable is not set");
  }
  if (!royaltyFeeNumeratorStr) {
    throw new Error("ROYALTY_FEE_NUMERATOR environment variable is not set");
  }

  // Convert the fee numerator string to BigInt as uint96 can be large
  const royaltyFeeNumerator = BigInt(royaltyFeeNumeratorStr);

  const teesaNft = m.contract("TeesaNft", [
    nftName,
    nftSymbol,
    teamAddress, // Corresponds to royaltyReceiver
    royaltyFeeNumerator // Corresponds to royaltyFeeNumerator
  ]);

  return { teesaNft };
});

export default TeesaNftModule;
