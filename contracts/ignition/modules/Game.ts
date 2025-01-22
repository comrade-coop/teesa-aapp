import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

require('dotenv').config();

const GameModule = buildModule("GameModule", (m) => {
  const teamAddress = process.env.TEAM_ADDRESS;
  if (!teamAddress) {
    throw new Error("TEAM_ADDRESS environment variable is not set");
  }

  const game = m.contract("Game", [teamAddress]);

  return { game };
});

export default GameModule;
