// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@limitbreak/creator-token-standards/src/access/OwnableInitializable.sol";
import "@limitbreak/creator-token-standards/src/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-standards/src/programmable-royalties/BasicRoyalties.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TeesaNft is ERC721C, BasicRoyalties, Ownable {
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
        Ownable()
    {}

    function mint(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _mint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        return tokenId;
    }

    /// @inheritdoc IERC721Metadata
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        return _tokenURIs[tokenId];
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721C, ERC2981)
        returns (bool)
    {
        return
            ERC721C.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }

    // @dev override the _requireCallerIsContractOwner function to allow the owner to mint
    function _requireCallerIsContractOwner() internal view virtual override {}
}
