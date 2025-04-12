import path from "path";
import { imageToReadableStream, mintNft, pinata } from "../src/nft-utils";
import { Readable } from "stream";

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TEESA_INITIAL_NFT_IMAGE_PATH = path.resolve(process.cwd(), '../nft/assets/initial-nft.png');

async function uploadImageToIpfs(inputStream: Readable): Promise<string> {
  const options: any = {
    pinataMetadata: {
      name: `Teesa - Initial NFT - image`,
    }
  };

  const result = await pinata().pinFileToIPFS(inputStream, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

async function uploadMetadataToIpfs(imageIpfsUrl: string): Promise<string> {
  const nftMetadata = {
    "name": "Teesa - Initial NFT",
    "description": `The initial NFT for the Teesa collection.`,
    "image": imageIpfsUrl,
    "attributes": []
  }

  const options: any = {
    pinataMetadata: {
      name: `Teesa - Initial NFT - metadata`,
    }
  };

  const result = await pinata().pinJSONToIPFS(nftMetadata, options);
  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `ipfs://${ipfsHash}`;

  return ipfsUrl;
}

(async () => {
  console.log("Generating initial NFT");
  
  const teamAddress = process.env.TEAM_ADDRESS;
  if (!teamAddress) {
    throw new Error('TEAM_ADDRESS is not set');
  }
  
  const imageStream = await imageToReadableStream(TEESA_INITIAL_NFT_IMAGE_PATH);
  const imageIpfsUrl = await uploadImageToIpfs(imageStream);
  const metadataIpfsUrl = await uploadMetadataToIpfs(imageIpfsUrl);
  const tokenId = await mintNft(teamAddress, metadataIpfsUrl);
  
  console.log(`Initial NFT published successfully. Token ID: ${tokenId.toString()}`);
})();