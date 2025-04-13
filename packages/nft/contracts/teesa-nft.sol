// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@limitbreak/creator-token-standards/src/access/OwnableBasic.sol";
import "@limitbreak/creator-token-standards/src/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-standards/src/programmable-royalties/BasicRoyalties.sol";

contract TeesaNft is OwnableBasic, ERC721C, BasicRoyalties {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        address teamAddress_
    )
        ERC721OpenZeppelin("Teesa", "TEESA")
        BasicRoyalties(
            teamAddress_,
            1000 // Royalty fee numerator: 1000 = 10%
        )
    {}

    function mint(
        address to,
        string memory uri
    ) external returns (uint256) {
        _requireCallerIsContractOwner();

        uint256 tokenId = _nextTokenId++;

        _mint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        return tokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        return _tokenURIs[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721C, ERC2981) returns (bool) {
        return
            ERC721C.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }
}
