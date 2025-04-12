import { getNetwork } from "../src/networks";

try {
    const network = getNetwork();
    console.log(network.name);
} catch (error) {
    console.error("Error getting network name:", error instanceof Error ? error.message : error);
    process.exit(1);
}
