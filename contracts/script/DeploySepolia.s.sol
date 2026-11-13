// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SahmExecutor} from "../src/SahmExecutor.sol";
import {MockRouter} from "../src/mocks/MockRouter.sol";

/// Base Sepolia: deploys a mock NVDA (via MockRouter at $180/share) and SahmExecutor, and allow-lists both.
/// The deployer becomes owner.  AGENT_ADDRESS = the agent wallet (public address).
///
/// forge script script/DeploySepolia.s.sol --rpc-url https://sepolia.base.org --account sahm-deployer --broadcast
contract DeploySepolia is Script {
    address constant SPM = 0xf85210B21cC50302F477BA56686d2019dC9b67Ad;
    address constant USDC_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external returns (SahmExecutor ex, MockRouter router) {
        require(block.chainid == 84532, "Base Sepolia only");
        address agent = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast();
        router = new MockRouter(USDC_SEPOLIA, msg.sender, 180e6, "Mock NVIDIA (testnet)", "tNVDA");
        ex = new SahmExecutor(SPM, USDC_SEPOLIA, msg.sender, agent);
        ex.setStock(address(router.stock()), true);
        ex.setRouter(address(router), true);
        vm.stopBroadcast();

        console.log("SahmExecutor:", address(ex));
        console.log("MockRouter:  ", address(router));
        console.log("tNVDA:       ", address(router.stock()));
    }
}
