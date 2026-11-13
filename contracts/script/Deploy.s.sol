// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SahmExecutor} from "../src/SahmExecutor.sol";

/// Deploys SahmExecutor. The deployer becomes owner.
///   AGENT_ADDRESS   the agent wallet (public address only)
///   STOCKS          comma-separated stock token addresses to allow-list (optional)
///   ROUTERS         comma-separated router addresses to allow-list (optional)
///   USDC_ADDRESS    defaults to Base mainnet USDC; on Base Sepolia use 0x036CbD53842c5426634e7929541eC2318f3dCF7e
///
/// forge script script/Deploy.s.sol --rpc-url base_sepolia --account sahm-deployer --broadcast --verify
contract Deploy is Script {
    address constant SPM = 0xf85210B21cC50302F477BA56686d2019dC9b67Ad;
    address constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external returns (SahmExecutor ex) {
        address agent = vm.envAddress("AGENT_ADDRESS");
        address usdc = vm.envOr("USDC_ADDRESS", BASE_USDC);
        address[] memory stocks = vm.envOr("STOCKS", ",", new address[](0));
        address[] memory routers = vm.envOr("ROUTERS", ",", new address[](0));

        vm.startBroadcast();
        ex = new SahmExecutor(SPM, usdc, msg.sender, agent);
        for (uint256 i; i < stocks.length; i++) ex.setStock(stocks[i], true);
        for (uint256 i; i < routers.length; i++) ex.setRouter(routers[i], true);
        vm.stopBroadcast();

        console.log("SahmExecutor:", address(ex));
    }
}
