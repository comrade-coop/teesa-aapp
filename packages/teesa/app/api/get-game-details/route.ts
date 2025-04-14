import { getNftContractAddress } from "@teesa-monorepo/nft/src/get-nft-contract-address";
import { getNetwork } from "@teesa-monorepo/nft/src/networks";
import { gameState } from "../../_core/game-state";

interface GameDetails {
    gameId: string;
    nftContractAddress: string;
    openseaCollectionUrl: string;
    winnerAddress: string | undefined;
    nftId: string | undefined;
    openseaNftUrl: string | undefined;
}

export async function GET(request: Request) {
    const network = getNetwork();

    const gameId = gameState.getId();
    const nftContractAddress = getNftContractAddress();
    const openseaCollectionUrl = `${network.openseaUrl}/${nftContractAddress}`;
    const winnerAddress = await gameState.getWinnerAddress();
    const nftId = await gameState.getNftId();
    const openseaNftUrl = nftId ? `${openseaCollectionUrl}/${nftId}` : undefined;

    const result: GameDetails = {
        gameId: gameId,
        nftContractAddress: nftContractAddress,
        openseaCollectionUrl: openseaCollectionUrl,
        winnerAddress: winnerAddress,
        nftId: nftId,
        openseaNftUrl: openseaNftUrl
    }
    
    return Response.json(result);
}