// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { Script } from "forge-std/Script.sol";

import { MintableERC20 } from "src/MintableERC20.sol";
import { WETH } from "src/WETH.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy WETH
        WETH weth = new WETH();

        // Deploy USDC
        MintableERC20 usdc = new MintableERC20("USD Coin", "USDC");
        // Mint USDC
        usdc.mint(msg.sender, 1_000_000 * 1e6);

        vm.stopBroadcast();
    }
}
