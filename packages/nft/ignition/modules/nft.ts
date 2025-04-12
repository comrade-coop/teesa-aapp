import { buildModule } from "@nomicfoundation/ignition-core";
import path from 'path';

require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const NftModule = buildModule("NftModule", (m: any) => {
  const teamAddress = process.env.TEAM_ADDRESS;

  if (!teamAddress) {
    throw new Error("TEAM_ADDRESS environment variable is not set");
  }

  const paymentSplitter = m.contract("PaymentSplitter", []);

  const teesaNft = m.contract("TeesaNft", [
    teamAddress,
    paymentSplitter
  ]);

  return { teesaNft, paymentSplitter };
});

export default NftModule;
