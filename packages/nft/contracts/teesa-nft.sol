// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@limitbreak/creator-token-standards/src/access/OwnableInitializable.sol";
import "@limitbreak/creator-token-standards/src/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-standards/src/programmable-royalties/MinterCreatorSharedRoyalties.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TeesaNft is ERC721C, MinterCreatorSharedRoyalties, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;

    constructor(
        address teamAddress_,
        address paymentSplitterReference_
    )
        ERC721OpenZeppelin("Teesa", "TEESA")
        MinterCreatorSharedRoyalties(
            1000, // Royalty fee numerator: 1000 = 10%
            500, // First owner of the NFT shares: 500 = 5%
            500, // Team shares: 500 = 5%
            teamAddress_,
            paymentSplitterReference_
        )
        Ownable()
    {}

    function mint(
        address to,
        string memory uri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _onMinted(to, tokenId);
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
        override(ERC721C, MinterCreatorSharedRoyaltiesBase)
        returns (bool)
    {
        return
            ERC721C.supportsInterface(interfaceId) ||
            MinterCreatorSharedRoyaltiesBase.supportsInterface(interfaceId);
    }

    // @dev override the _requireCallerIsContractOwner function to allow the owner to mint
    function _requireCallerIsContractOwner() internal view virtual override {}
}
