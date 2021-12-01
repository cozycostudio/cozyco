//SPDX-License-Identifier: Unlicense
/// @title: Cozy Co. Friends smart contract
/// @author: samking.eth

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "./IFriendTokenTypeMetadata.sol";

contract CozyCoFriends is
    Context,
    AccessControlEnumerable,
    Ownable,
    ERC1155Burnable
{
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    EnumerableMap.UintToAddressMap private tokenTypeMetadata;

    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    constructor() ERC1155("") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ISSUER_ROLE, _msgSender());
        _setupRole(REVOKER_ROLE, _msgSender());
    }

    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, _msgSender()), "Must have issuer role");
        _;
    }

    modifier onlyRevoker() {
        require(hasRole(REVOKER_ROLE, _msgSender()), "Must have revoker role");
        _;
    }

    function issueMembership(address to, uint256 tokenType)
        public
        virtual
        onlyIssuer
    {
        require(
            tokenTypeMetadata.contains(tokenType),
            "CozyCoFriends: no metadata"
        );
        require(balanceOf(to, tokenType) == 0, "Already a member");
        _mint(to, tokenType, 1, "");
    }

    function issueMemberships(address[] memory _members, uint256 tokenType)
        public
        virtual
        onlyIssuer
    {
        for (uint256 i = 0; i < _members.length; i++) {
            issueMembership(_members[i], tokenType);
        }
    }

    function revokeMembership(
        address _address,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual onlyRevoker {
        _burnBatch(_address, ids, amounts);
    }

    function setTokenTypeMetadataAddress(uint256 id, address _address)
        public
        onlyOwner
    {
        tokenTypeMetadata.set(id, _address);
    }

    function getTokenTypeMetadataAddress(uint256 id)
        public
        view
        returns (bool, address)
    {
        return tokenTypeMetadata.tryGet(id);
    }

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(tokenTypeMetadata.contains(id), "CozyCoFriends: no metadata");
        return IFriendTokenTypeMetadata(tokenTypeMetadata.get(id)).getURI(id);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
