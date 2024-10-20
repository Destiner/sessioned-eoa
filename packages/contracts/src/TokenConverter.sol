// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20 } from "forge-std/interfaces/IERC20.sol";

contract TokenConverter {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public rate;

    constructor(IERC20 _tokenA, IERC20 _tokenB, uint256 _rate) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        rate = _rate;
    }

    function convert(uint256 amountIn, bool fromAToB) external {
        IERC20 from = fromAToB ? tokenA : tokenB;
        IERC20 to = fromAToB ? tokenB : tokenA;
        uint256 tokenRate = fromAToB ? rate : 1 ether * 1 ether / rate;
        _convert(amountIn, from, to, tokenRate);
    }

    function _convert(
        uint256 amountIn,
        IERC20 tokenFrom,
        IERC20 tokenTo,
        uint256 tokenRate
    )
        internal
    {
        tokenFrom.transferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = amountIn * tokenRate / 1 ether;
        tokenTo.transfer(msg.sender, amountOut);
    }
}
