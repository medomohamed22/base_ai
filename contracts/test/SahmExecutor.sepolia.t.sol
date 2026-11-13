// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SahmExecutor} from "../src/SahmExecutor.sol";
import {ISpendPermissionManager} from "../src/interfaces/ISpendPermissionManager.sol";
import {MockRouter} from "../src/mocks/MockRouter.sol";

interface IFactory {
    function createAccount(bytes[] calldata owners, uint256 nonce) external payable returns (address);
}

interface IWallet {
    function replaySafeHash(bytes32) external view returns (bytes32);
}

interface IBal {
    function balanceOf(address) external view returns (uint256);
}

/// End-to-end on a Base Sepolia fork with the same setup DeploySepolia.s.sol creates.
contract SahmExecutorSepoliaTest is Test {
    address constant SPM = 0xf85210B21cC50302F477BA56686d2019dC9b67Ad;
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant FACTORY = 0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a;

    struct SignatureWrapper {
        uint256 ownerIndex;
        bytes signatureData;
    }

    SahmExecutor ex;
    MockRouter router;
    address agent;
    address wallet;
    uint256 constant PK = 0xB0B;

    function setUp() public {
        vm.createSelectFork(vm.envOr("BASE_SEPOLIA_RPC_URL", string("https://sepolia.base.org")));
        agent = makeAddr("agent");
        router = new MockRouter(USDC, address(this), 180e6, "Mock NVIDIA (testnet)", "tNVDA");
        ex = new SahmExecutor(SPM, USDC, address(this), agent);
        ex.setStock(address(router.stock()), true);
        ex.setRouter(address(router), true);

        bytes[] memory owners = new bytes[](2);
        owners[0] = abi.encode(vm.addr(PK));
        owners[1] = abi.encode(SPM);
        wallet = IFactory(FACTORY).createAccount(owners, 7);
        deal(USDC, wallet, 50e6);
    }

    function _perm() internal view returns (ISpendPermissionManager.SpendPermission memory) {
        return ISpendPermissionManager.SpendPermission({
            account: wallet,
            spender: address(ex),
            token: USDC,
            allowance: 5e6,
            period: 1 days,
            start: uint48(block.timestamp),
            end: uint48(block.timestamp + 30 days),
            salt: 1,
            extraData: ""
        });
    }

    function _sign(ISpendPermissionManager.SpendPermission memory p) internal view returns (bytes memory) {
        bytes32 h = IWallet(wallet).replaySafeHash(ISpendPermissionManager(SPM).getHash(p));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PK, h);
        return abi.encode(SignatureWrapper(0, abi.encodePacked(r, s, v)));
    }

    function test_sepoliaMockBuy() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        address stock = address(router.stock());
        uint256 minOut = router.quote(5e6);
        bytes memory swapData = abi.encodeCall(MockRouter.swapExactIn, (5e6, wallet));
        vm.prank(agent);
        ex.execute(p, sig, 5e6, stock, minOut, address(router), swapData, block.timestamp + 60);

        assertEq(IBal(stock).balanceOf(wallet), minOut); // 5/180 of a share
        assertEq(IBal(USDC).balanceOf(wallet), 45e6);
        assertEq(IBal(USDC).balanceOf(address(ex)), 0);
    }
}
