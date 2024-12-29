const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

require('dotenv').config();

const GameModule = buildModule("GameModule", (m: any) => {
  const teamAddressesStr = process.env.TEAM_ADDRESSES;
  if (!teamAddressesStr) {
    throw new Error("TEAM_ADDRESSES environment variable is not set");
  }

  const teamAddresses = teamAddressesStr.split(',').map(addr => addr.trim());
  
  if (teamAddresses.length === 0) {
    throw new Error("At least one team address is required");
  }

  const game = m.contract("Game", [teamAddresses]);

  return { game };
});

module.exports = GameModule;
