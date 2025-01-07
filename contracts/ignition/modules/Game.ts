const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

require('dotenv').config();

const GameModule = buildModule("GameModule", (m: any) => {
  const teamAddresses = process.env.TEAM_ADDRESSES;
  if (!teamAddresses) {
    throw new Error("TEAM_ADDRESSES environment variable is not set");
  }

  const teamAddressesArray = teamAddresses.split(',').map(addr => addr.trim());
  if (teamAddressesArray.length === 0) {
    throw new Error("At least one team address is required");
  }

  const game = m.contract("Game", [teamAddressesArray]);

  return { game };
});

module.exports = GameModule;
