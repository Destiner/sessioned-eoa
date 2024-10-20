// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ERC20 } from "solady/tokens/ERC20.sol";

contract WETH is ERC20 {
    function name() public pure override returns (string memory) {
        return "Wrapped Ether";
    }

    function symbol() public pure override returns (string memory) {
        return "WETH";
    }

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    fallback() external payable {
        _mint(msg.sender, msg.value);
    }
}
