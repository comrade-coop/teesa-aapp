import { buildModule } from "@nomicfoundation/ignition-core";
import path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const TeesaNftModule = buildModule("TeesaNftModule", (m: any) => {
  const nftName = process.env.NFT_NAME;
  const nftSymbol = process.env.NFT_SYMBOL;
  const royaltyFeeReceiverAddress = process.env.ROYALTY_FEE_RECEIVER_ADDRESS;
  const royaltyFeeNumeratorStr = process.env.ROYALTY_FEE_NUMERATOR;

  if (!nftName) {
    throw new Error("NFT_NAME environment variable is not set");
  }
  if (!nftSymbol) {
    throw new Error("NFT_SYMBOL environment variable is not set");
  }
  if (!royaltyFeeReceiverAddress) {
    throw new Error("ROYALTY_FEE_RECEIVER_ADDRESS environment variable is not set");
  }
  if (!royaltyFeeNumeratorStr) {
    throw new Error("ROYALTY_FEE_NUMERATOR environment variable is not set");
  }

  // Convert the fee numerator string to BigInt as uint96 can be large
  const royaltyFeeNumerator = BigInt(royaltyFeeNumeratorStr);

  const teesaNft = m.contract("TeesaNft", [
    nftName,
    nftSymbol,
    royaltyFeeReceiverAddress,
    royaltyFeeNumerator
  ]);

  return { teesaNft };
});

export default TeesaNftModule;
