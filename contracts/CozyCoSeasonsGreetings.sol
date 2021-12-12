//SPDX-License-Identifier: Unlicense
/// @title: cozy co. seasons greetings cards
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

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base64.sol";
import "./ICozyCoMembership.sol";

contract CozyCoSeasonsGreetings is ERC721, Ownable {
    uint256 public constant PRICE = 0.005 ether;
    uint256 public constant MAX_MEMBER_FREE_SENDS = 3;
    bool public isPostOfficeOpen = true;
    string public baseImageURI;
    string public baseAnimationURI;
    uint16 public totalSupply;

    address private membershipAddr;
    mapping(address => uint256) private memberFreeSendCount;

    struct GreetingsCard {
        uint256 seed;
        address from;
        address to;
    }

    mapping(uint256 => GreetingsCard) private _greetingsCards;

    function sendGreetingFromMember(address to) public {
        // Check if sender has a cozy co membership card
        require(
            ICozyCoMembership(membershipAddr).balanceOf(_msgSender(), 1) > 0,
            "not a cozy co member"
        );
        // See if they have any free mints
        require(
            memberFreeSendCount[_msgSender()] < MAX_MEMBER_FREE_SENDS,
            "no more free sends"
        );
        _sendGreeting(to);
        memberFreeSendCount[_msgSender()] += 1;
    }

    function sendGreeting(address to) public payable {
        require(msg.value == PRICE, "incorrect price");
        _sendGreeting(to);
    }

    function _sendGreeting(address to) private {
        require(isPostOfficeOpen, "post office is closed");
        uint256 tokenId = totalSupply + 1;
        _safeMint(to, tokenId);
        totalSupply += 1;
        GreetingsCard memory card;
        card.seed = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),
                    _msgSender(),
                    tokenId
                )
            )
        );
        card.from = _msgSender() == to ? address(0) : _msgSender();
        card.to = to;
        _greetingsCards[tokenId] = card;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721)
        returns (string memory)
    {
        require(_exists(tokenId), "card doesn't exist");
        GreetingsCard memory greeting = _greetingsCards[tokenId];
        string memory from = addressToString(greeting.from);
        string memory to = addressToString(greeting.to);
        bytes memory queryParams = abi.encodePacked(
            "?s=",
            Strings.toString(greeting.seed),
            "&f=",
            from,
            "&t=",
            to
        );
        string memory attributes = string(
            abi.encodePacked(
                '"attributes": [{"trait_type": "Seed", "value": "',
                Strings.toString(greeting.seed),
                '"}, {"trait_type": "From", "value": "',
                from,
                '"}, {"trait_type": "To", "value": "',
                to,
                '"}]'
            )
        );
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "cozy co. greetings card #',
                        Strings.toString(tokenId),
                        '", "description": "send a greetings card to a friend this season and spread the cozy vibes", "image": "',
                        baseImageURI,
                        queryParams,
                        '", "animation_url": "',
                        baseAnimationURI,
                        queryParams,
                        '", ',
                        attributes,
                        "}"
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function addressToString(address _addr)
        internal
        pure
        returns (string memory)
    {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
        // Set the new and prev owners when sending cards
        GreetingsCard memory updatedGreeting = _greetingsCards[tokenId];
        updatedGreeting.from = from;
        updatedGreeting.to = to;
        _greetingsCards[tokenId] = updatedGreeting;
    }

    function setBaseImageURI(string memory uri) public onlyOwner {
        baseImageURI = uri;
    }

    function setBaseAnimationURI(string memory uri) public onlyOwner {
        baseAnimationURI = uri;
    }

    function closePostOffice() public onlyOwner {
        isPostOfficeOpen = false;
    }

    function getSeedForTokenId(uint256 tokenId)
        public
        view
        returns (uint256 seed)
    {
        GreetingsCard memory greeting = _greetingsCards[tokenId];
        return greeting.seed;
    }

    function burn(uint256 tokenID) public {
        _burn(tokenID);
    }

    function withdraw() public payable onlyOwner {
        require(
            payable(_msgSender()).send(address(this).balance),
            "Withdraw error"
        );
    }

    constructor(
        string memory _baseImageURI,
        string memory _baseAnimationURI,
        address _membershipContract
    ) ERC721("cozy co. seasons greetings 2021", "CCSG") {
        baseImageURI = _baseImageURI;
        baseAnimationURI = _baseAnimationURI;
        membershipAddr = _membershipContract;
    }
}
