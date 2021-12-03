//SPDX-License-Identifier: Unlicense
/// @title: cozy co. membership
/// @author: The Stitcher AKA samking.eth
/*            



           :-.:-   .-:.=:    -==. :- .===  .==:      :-::-   .--.-:
         *@%..=@--%@+  %@# .#%%@@#-+.-@@#  #@@-    +@@: -@*:%@#  *@%.
        %@@:  :.-@@%  .@@@  ....:-:  %@@: -@@#    +@@=  ::.@@@.  %@@:
        %@@-    -@@+  #@@--=*%#*++*.-@@%.:%@@:    *@@+   ..@@#  +@@=-%@*
         =*#*=:  .+=.=+-  ==..=*#+: .**+--@@+      -***=-  .=+.-+-  .**=
                                   +@%. .@@=
                                    :=..-:

*/

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMembershipTokenMetadata.sol";

contract CozyCoMembership is AccessControlEnumerable, Ownable, ERC1155Burnable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    mapping(uint256 => address) private _tokenMetadata;

    constructor() ERC1155("") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ISSUER_ROLE, _msgSender());
        _setupRole(REVOKER_ROLE, _msgSender());
    }

    function issueMembership(address to, uint256 token) public virtual {
        require(hasRole(ISSUER_ROLE, _msgSender()), "Must have issuer role");
        require(
            _tokenMetadata[token] != address(0),
            "CozyCoMembership: no metadata"
        );
        require(balanceOf(to, token) == 0, "Already has token");
        _mint(to, token, 1, "");
    }

    function issueMemberships(address[] memory _members, uint256 token)
        public
        virtual
    {
        require(hasRole(ISSUER_ROLE, _msgSender()), "Must have issuer role");
        for (uint256 i = 0; i < _members.length; i++) {
            issueMembership(_members[i], token);
        }
    }

    function revokeMembership(
        address _address,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual {
        require(hasRole(REVOKER_ROLE, _msgSender()), "Must have revoker role");
        _burnBatch(_address, ids, amounts);
    }

    function setTokenMetadataAddress(uint256 id, address _address)
        public
        onlyOwner
    {
        _tokenMetadata[id] = _address;
    }

    function setTokenMetadataAddressForRange(
        uint256 startId,
        uint256 endId,
        address _address
    ) public onlyOwner {
        for (uint256 id = startId; id < endId; id++) {
            _tokenMetadata[id] = _address;
        }
    }

    function getTokenMetadataAddress(uint256 id) public view returns (address) {
        return _tokenMetadata[id];
    }

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _tokenMetadata[id] != address(0),
            "CozyCoMembership: no metadata"
        );
        return IMembershipTokenMetadata(_tokenMetadata[id]).getURI(id);
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
}
