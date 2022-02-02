// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC1155 {
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );

    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    event URI(string value, uint256 indexed id);

    function balanceOf(address account, uint256 id) external view returns (uint256);

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory);

    function setApprovalForAll(address operator, bool approved) external;

    function isApprovedForAll(address account, address operator) external view returns (bool);

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external;
}

/// @notice Fork of Rari-Capital Solmate that uses an function for `isApprovedForAll`
///         https://github.com/Rari-Capital/solmate/blob/main/src/tokens/ERC1155.sol
/// @author samking.eth
abstract contract ERC1155 is IERC1155 {
    /**************************************************************************
     * STORAGE
     *************************************************************************/

    mapping(address => mapping(uint256 => uint256)) public _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /**************************************************************************
     * ERRORS
     *************************************************************************/

    error NotAuthorized();
    error UnsafeRecipient();
    error LengthMismatch();

    /**************************************************************************
     * METADATA LOGIC
     *************************************************************************/

    function uri(uint256 id) public view virtual returns (string memory);

    /**************************************************************************
     * ERC1155 ACTIONS
     *************************************************************************/

    function setApprovalForAll(address operator, bool approved) public virtual {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator)
        public
        view
        virtual
        returns (bool)
    {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual {
        if (msg.sender != from || !_operatorApprovals[from][msg.sender]) revert NotAuthorized();

        _balances[from][id] -= amount;
        _balances[to][id] += amount;

        emit TransferSingle(msg.sender, from, to, id, amount);

        // if (
        //     !(to.code.length == 0 && to != address(0)) ||
        //     ERC1155TokenReceiver(to).onERC1155Received(msg.sender, from, id, amount, data) !=
        //     ERC1155TokenReceiver.onERC1155Received.selector
        // ) revert UnsafeRecipient();

        require(
            to.code.length == 0
                ? to != address(0)
                : ERC1155TokenReceiver(to).onERC1155Received(msg.sender, from, id, amount, data) ==
                    ERC1155TokenReceiver.onERC1155Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual {
        uint256 idsLength = ids.length; // Saves MLOADs.
        if (idsLength != amounts.length) revert LengthMismatch();
        if (msg.sender != from || !_operatorApprovals[from][msg.sender]) revert NotAuthorized();

        for (uint256 i = 0; i < idsLength; ) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            _balances[from][id] -= amount;
            _balances[to][id] += amount;

            // An array can't have a total length
            // larger than the max uint256 value.
            unchecked {
                i++;
            }
        }

        emit TransferBatch(msg.sender, from, to, ids, amounts);

        // if (
        //     !(to.code.length == 0 && to != address(0)) ||
        //     ERC1155TokenReceiver(to).onERC1155BatchReceived(msg.sender, from, ids, amounts, data) !=
        //     ERC1155TokenReceiver.onERC1155BatchReceived.selector
        // ) revert UnsafeRecipient();

        require(
            to.code.length == 0
                ? to != address(0)
                : ERC1155TokenReceiver(to).onERC1155BatchReceived(
                    msg.sender,
                    from,
                    ids,
                    amounts,
                    data
                ) == ERC1155TokenReceiver.onERC1155BatchReceived.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function balanceOf(address owner, uint256 id) external view returns (uint256) {
        return _balances[owner][id];
    }

    function balanceOfBatch(address[] memory owners, uint256[] memory ids)
        public
        view
        virtual
        returns (uint256[] memory balances)
    {
        uint256 ownersLength = owners.length; // Saves MLOADs.
        if (ownersLength != ids.length) revert LengthMismatch();
        balances = new uint256[](owners.length);

        // Unchecked because the only math done is incrementing
        // the array index counter which cannot possibly overflow.
        unchecked {
            for (uint256 i = 0; i < ownersLength; i++) {
                balances[i] = _balances[owners[i]][ids[i]];
            }
        }
    }

    /**************************************************************************
     * ERC165 LOGIC
     *************************************************************************/

    function supportsInterface(bytes4 interfaceId) external pure virtual returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0xd9b67a26 || // ERC165 Interface ID for ERC1155
            interfaceId == 0x0e89341c || // ERC165 Interface ID for ERC1155MetadataURI
            interfaceId == 0x2a55205a; // ERC165 Interface ID for EIP2981
    }

    /**************************************************************************
     * MINT & BURN
     *************************************************************************/

    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        _balances[to][id] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);

        // if (
        //     !(to.code.length == 0 && to != address(0)) ||
        //     ERC1155TokenReceiver(to).onERC1155Received(msg.sender, address(0), id, amount, data) !=
        //     ERC1155TokenReceiver.onERC1155Received.selector
        // ) revert UnsafeRecipient();

        require(
            to.code.length == 0
                ? to != address(0)
                : ERC1155TokenReceiver(to).onERC1155Received(
                    msg.sender,
                    address(0),
                    id,
                    amount,
                    data
                ) == ERC1155TokenReceiver.onERC1155Received.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        uint256 idsLength = ids.length; // Saves MLOADs.
        if (idsLength != amounts.length) revert LengthMismatch();

        for (uint256 i = 0; i < idsLength; ) {
            _balances[to][ids[i]] += amounts[i];

            // An array can't have a total length
            // larger than the max uint256 value.
            unchecked {
                i++;
            }
        }

        emit TransferBatch(msg.sender, address(0), to, ids, amounts);

        // if (
        //     !(to.code.length == 0 && to != address(0)) ||
        //     ERC1155TokenReceiver(to).onERC1155BatchReceived(
        //         msg.sender,
        //         address(0),
        //         ids,
        //         amounts,
        //         data
        //     ) !=
        //     ERC1155TokenReceiver.onERC1155BatchReceived.selector
        // ) revert UnsafeRecipient();

        require(
            to.code.length == 0
                ? to != address(0)
                : ERC1155TokenReceiver(to).onERC1155BatchReceived(
                    msg.sender,
                    address(0),
                    ids,
                    amounts,
                    data
                ) == ERC1155TokenReceiver.onERC1155BatchReceived.selector,
            "UNSAFE_RECIPIENT"
        );
    }

    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal {
        _balances[from][id] -= amount;

        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }

    function _burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal {
        uint256 idsLength = ids.length; // Saves MLOADs.
        if (idsLength != amounts.length) revert LengthMismatch();

        for (uint256 i = 0; i < idsLength; ) {
            _balances[from][ids[i]] -= amounts[i];

            // An array can't have a total length
            // larger than the max uint256 value.
            unchecked {
                i++;
            }
        }

        emit TransferBatch(msg.sender, from, address(0), ids, amounts);
    }
}

interface ERC1155TokenReceiver {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external returns (bytes4);

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external returns (bytes4);
}
