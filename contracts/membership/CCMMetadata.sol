//SPDX-License-Identifier: Unlicense
/// @title: cozy co. membership: on-chain metadata
/// @author: The Quilt Stitcher AKA samking.eth
/*            



           :-.:-   .-:.=:    -==. :- .===  .==:      :-::-   .--.-:
         *@%..=@--%@+  %@# .#%%@@#-+.-@@#  #@@-    +@@: -@*:%@#  *@%.
        %@@:  :.-@@%  .@@@  ....:-:  %@@: -@@#    +@@=  ::.@@@.  %@@:
        %@@-    -@@+  #@@--=*%#*++*.-@@%.:%@@:    *@@+   ..@@#  +@@=-%@*
         =*#*=:  .+=.=+-  ==..=*#+: .**+--@@+      -***=-  .=+.-+-  .**=
                                   +@%. .@@=
                                    :=..-:

*/

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Base64.sol";
import "./IMembershipMetadata.sol";

contract CCMMetadata is Ownable, IMembershipMetadata {
    struct MembershipMetadata {
        string name;
        string description;
        string imageURI;
        string animationURI;
    }

    mapping(uint256 => MembershipMetadata) public membershipMetadata;

    constructor() Ownable() {}

    function setMetadata(uint256 membershipId, MembershipMetadata memory metadata)
        public
        onlyOwner
    {
        membershipMetadata[membershipId] = metadata;
    }

    function setName(uint256 membershipId, string memory _name) public onlyOwner {
        membershipMetadata[membershipId].name = _name;
    }

    function setDescription(uint256 membershipId, string memory _desc) public onlyOwner {
        membershipMetadata[membershipId].description = _desc;
    }

    function setImageURI(uint256 membershipId, string memory _imageURI) public onlyOwner {
        membershipMetadata[membershipId].imageURI = _imageURI;
    }

    function setAnimationURI(uint256 membershipId, string memory _animationURI) public onlyOwner {
        membershipMetadata[membershipId].animationURI = _animationURI;
    }

    function getURI(uint256 membershipId) public view override returns (string memory) {
        MembershipMetadata memory metadata = membershipMetadata[membershipId];
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "',
                        metadata.name,
                        '", "description": "',
                        metadata.description,
                        '", "image": "',
                        metadata.imageURI,
                        bytes(metadata.animationURI).length > 0
                            ? string(
                                abi.encodePacked('", "animation_url": "', metadata.animationURI)
                            )
                            : "",
                        '", "attributes": [{ "trait_type": "Membership", "value": "',
                        metadata.name,
                        '" }]}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
