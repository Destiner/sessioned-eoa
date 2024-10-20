// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ERC20 } from "solady/tokens/ERC20.sol";

contract MintableERC20 is ERC20 {
    address public minter;
    string internal _name;
    string internal _symbol;

    constructor(string memory __name, string memory __symbol) {
        minter = msg.sender;
        _name = __name;
        _symbol = __symbol;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "MintableERC20: only minter can mint");
        _mint(to, amount);
    }

    function setMinter(address newMinter) external {
        require(msg.sender == minter, "MintableERC20: only minter can set minter");
        minter = newMinter;
    }
}
