// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@limitbreak/creator-token-standards/src/access/OwnableBasic.sol";
import "@limitbreak/creator-token-standards/src/erc721c/ERC721C.sol";
import "@limitbreak/creator-token-standards/src/programmable-royalties/BasicRoyalties.sol";

contract TeesaNft is OwnableBasic, ERC721C, BasicRoyalties {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _minters;
    mapping(address => uint256[]) private _mintedTokensByAddress;
    mapping(address => bool) private _hasMinted;

    constructor(
        address teamAddress_
    )
        ERC721OpenZeppelin("Teesa", "TEESA")
        BasicRoyalties(
            teamAddress_,
            1000 // Royalty fee numerator: 1000 = 10%
        )
    {}

    /**
     * @notice Mints a new token and assigns it to the specified address.
     * @dev Only the contract owner can mint tokens.
     * @param to The address to assign the new token to.
     * @param uri The URI of the token's metadata.
     * @return The ID of the newly minted token.
     */
    function mint(
        address to,
        string memory uri
    ) external returns (uint256) {
        _requireCallerIsContractOwner();

        uint256 tokenId = _nextTokenId++;

        _mint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        // Store information about the mint
        _minters[tokenId] = to;
        _mintedTokensByAddress[to].push(tokenId);
        if (!_hasMinted[to]) {
            _hasMinted[to] = true;
        }

        return tokenId;
    }

    /**
     * @notice Returns the address that minted the token with the given ID.
     * @dev Throws if the token ID does not exist.
     * @param tokenId The ID of the token to query the minter of.
     * @return The address of the minter.
     */
    function minterOf(
        uint256 tokenId
    ) public view virtual returns (address) {
        _requireMinted(tokenId);
        return _minters[tokenId];
    }

    /**
     * @notice Returns an array of token IDs minted by the specified address.
     * @param minterAddress The address to query the minted tokens for.
     * @return An array of uint256 representing the token IDs minted by the address.
     */
    function mintedTokens(
        address minterAddress
    ) public view returns (uint256[] memory) {
        return _mintedTokensByAddress[minterAddress];
    }

    /**
     * @notice Checks if the specified address has minted any tokens in this contract.
     * @param potentialMinter The address to check.
     * @return True if the address has minted at least one token, false otherwise.
     */
    function isMinter(
        address potentialMinter
    ) public view returns (bool) {
        return _hasMinted[potentialMinter];
    }

    /**
     * @notice Returns the URI of the token with the given ID.
     * @dev Throws if the token ID does not exist.
     * @param tokenId The ID of the token to query the URI for.
     * @return The URI of the token.
     */
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
