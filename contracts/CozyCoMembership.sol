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
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IMembershipTokenMetadata.sol";

contract CozyCoMembership is Ownable, ERC1155Burnable {
    mapping(uint256 => address) private _membershipMetadata;
    uint256[] private _membershipTypes;

    function uri(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _membershipMetadata[id] != address(0),
            "CozyCoMembership: no metadata"
        );
        return IMembershipTokenMetadata(_membershipMetadata[id]).getURI(id);
    }

    function issueMembership(address to, uint256 token)
        public
        virtual
        onlyOwner
    {
        require(
            _membershipMetadata[token] != address(0),
            "CozyCoMembership: no metadata"
        );
        require(balanceOf(to, token) == 0, "CozyCoMembership: already member");
        _mint(to, token, 1, "");
    }

    function issueMemberships(address[] memory _members, uint256 token)
        public
        virtual
        onlyOwner
    {
        for (uint256 i = 0; i < _members.length; i++) {
            issueMembership(_members[i], token);
        }
    }

    function issueCustomMembership(
        address to,
        uint256 token,
        address metadata
    ) public virtual onlyOwner {
        require(
            _membershipMetadata[token] == address(0),
            "CozyCoMembership: tokenId in use"
        );
        require(balanceOf(to, token) == 0, "CozyCoMembership: already member");
        _membershipMetadata[token] = metadata;
        _mint(to, token, 1, "");
    }

    function revokeMembership(
        address _address,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual onlyOwner {
        _burnBatch(_address, ids, amounts);
    }

    function addMembershipMetadataAddress(
        uint256 membershipId,
        address _address
    ) public onlyOwner {
        require(
            _membershipMetadata[membershipId] == address(0),
            "CozyCoMembership: tokenId in use"
        );
        _membershipMetadata[membershipId] = _address;
        _membershipTypes.push(membershipId);
    }

    function updateMembershipMetadataAddress(
        uint256 membershipId,
        address _address
    ) public onlyOwner {
        _membershipMetadata[membershipId] = _address;
    }

    function getMembershipTypes()
        public
        view
        returns (uint256[] memory membershipTypes)
    {
        return _membershipTypes;
    }

    function getMembershipMetadataAddress(uint256 membershipId)
        public
        view
        returns (address)
    {
        return _membershipMetadata[membershipId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    constructor() ERC1155("") {}
}
