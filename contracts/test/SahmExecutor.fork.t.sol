// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SahmExecutor} from "../src/SahmExecutor.sol";
import {ISpendPermissionManager} from "../src/interfaces/ISpendPermissionManager.sol";
import {ClPoolRouter} from "./helpers/ClPoolRouter.sol";

interface ISmartWalletFactory {
    function createAccount(bytes[] calldata owners, uint256 nonce) external payable returns (address);
}

interface ISmartWallet {
    function replaySafeHash(bytes32 hash) external view returns (bytes32);
    function execute(address target, uint256 value, bytes calldata data) external payable;
}

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);
}

/// Fork tests against Base mainnet: real USDC, real SpendPermissionManager, real Coinbase Smart Wallet,
/// real NVDAc tokenized stock and its real Aerodrome Slipstream pool.
/// Run: BASE_RPC_URL=https://mainnet.base.org forge test --fork-url $BASE_RPC_URL -vv
contract SahmExecutorForkTest is Test {
    address constant SPM_ADDR = 0xf85210B21cC50302F477BA56686d2019dC9b67Ad;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant FACTORY = 0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a;
    address constant NVDA = 0xb20000000000000000000078ee7ce2fE4908108C;
    address constant NVDA_POOL = 0xF668e21993f0ACd7ab00BB1cFbAeD0df28A3C8EC; // Aerodrome CL USDC/NVDAc
    address constant MSFT = 0xB200000000000000000000Ab99cFa739E253872B;

    ISpendPermissionManager spm = ISpendPermissionManager(SPM_ADDR);
    SahmExecutor ex;
    ClPoolRouter router;

    address owner = makeAddr("owner");
    address agent = makeAddr("agent");
    uint256 userPk = 0xA11CE;
    address userEoa;
    address wallet; // the user's Coinbase Smart Wallet

    uint160 constant DAILY_CAP = 10e6; // $10/day
    uint160 constant FIVE = 5e6;

    function setUp() public {
        string memory rpc = vm.envOr("BASE_RPC_URL", string("https://mainnet.base.org"));
        vm.createSelectFork(rpc);

        userEoa = vm.addr(userPk);
        bytes[] memory owners = new bytes[](2);
        owners[0] = abi.encode(userEoa);
        owners[1] = abi.encode(SPM_ADDR); // SPM must be an owner to pull funds
        wallet = ISmartWalletFactory(FACTORY).createAccount(owners, uint256(keccak256("sahm-test")));
        deal(USDC, wallet, 100e6);

        ex = new SahmExecutor(SPM_ADDR, USDC, owner, agent);
        router = new ClPoolRouter();
        vm.startPrank(owner);
        ex.setStock(NVDA, true);
        ex.setRouter(address(router), true);
        vm.stopPrank();
    }

    // ------------------------------------------------------------ helpers

    function _perm() internal view returns (ISpendPermissionManager.SpendPermission memory p) {
        p = ISpendPermissionManager.SpendPermission({
            account: wallet,
            spender: address(ex),
            token: USDC,
            allowance: DAILY_CAP,
            period: 1 days,
            start: uint48(block.timestamp),
            end: uint48(block.timestamp + 30 days),
            salt: 1,
            extraData: ""
        });
    }

    struct SignatureWrapper {
        uint256 ownerIndex;
        bytes signatureData;
    }

    function _sign(ISpendPermissionManager.SpendPermission memory p) internal view returns (bytes memory) {
        bytes32 h = ISmartWallet(wallet).replaySafeHash(spm.getHash(p));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPk, h);
        return abi.encode(SignatureWrapper(0, abi.encodePacked(r, s, v)));
    }

    function _swapData(uint256 amount) internal view returns (bytes memory) {
        return abi.encodeCall(ClPoolRouter.swapExactIn, (NVDA_POOL, USDC, amount, wallet));
    }

    function _exec(ISpendPermissionManager.SpendPermission memory p, bytes memory sig, uint160 amount, uint256 minOut)
        internal
    {
        vm.prank(agent);
        ex.execute(p, sig, amount, NVDA, minOut, address(router), _swapData(amount), block.timestamp + 300);
    }

    // ------------------------------------------------------------ tests

    /// 1. Buy $5 of NVDA: stock lands in the user's wallet, executor holds nothing.
    function test_buyFiveDollarsOfNvda() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        uint256 usdcBefore = IERC20(USDC).balanceOf(wallet);

        _exec(p, _sign(p), FIVE, 1);

        uint256 got = IERC20(NVDA).balanceOf(wallet);
        emit log_named_decimal_uint("NVDAc received", got, 8);
        assertGt(got, 0, "no stock");
        assertEq(IERC20(USDC).balanceOf(wallet), usdcBefore - FIVE, "usdc spent");
        assertEq(IERC20(USDC).balanceOf(address(ex)), 0, "executor usdc");
        assertEq(IERC20(NVDA).balanceOf(address(ex)), 0, "executor stock");
        assertEq(IERC20(USDC).allowance(address(ex), address(router)), 0, "allowance reset");
    }

    /// 2. minOut higher than possible: revert, no USDC leaves the wallet.
    function test_revertWhenMinOutTooHigh() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        uint256 usdcBefore = IERC20(USDC).balanceOf(wallet);
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert();
        ex.execute(p, sig, FIVE, NVDA, type(uint128).max, address(router), _swapData(FIVE), block.timestamp + 300);
        assertEq(IERC20(USDC).balanceOf(wallet), usdcBefore);
    }

    /// 3. Anyone other than the agent: revert.
    function test_revertWhenNotAgent() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        vm.prank(makeAddr("attacker"));
        vm.expectRevert(SahmExecutor.NotAgent.selector);
        ex.execute(p, sig, FIVE, NVDA, 1, address(router), _swapData(FIVE), block.timestamp + 300);
    }

    /// 4a. Stock not allow-listed: revert.
    function test_revertWhenStockNotAllowed() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert(SahmExecutor.StockNotAllowed.selector);
        ex.execute(p, sig, FIVE, MSFT, 1, address(router), _swapData(FIVE), block.timestamp + 300);
    }

    /// 4b. Router not allow-listed: revert.
    function test_revertWhenRouterNotAllowed() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        ClPoolRouter rogue = new ClPoolRouter();
        vm.prank(agent);
        vm.expectRevert(SahmExecutor.RouterNotAllowed.selector);
        ex.execute(p, sig, FIVE, NVDA, 1, address(rogue), _swapData(FIVE), block.timestamp + 300);
    }

    /// 5. Amount above the daily on-chain cap: revert (enforced by SPM).
    function test_revertWhenAboveDailyCap() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert();
        ex.execute(p, sig, DAILY_CAP + 1, NVDA, 1, address(router), _swapData(DAILY_CAP + 1), block.timestamp + 300);
    }

    /// 6. After the user revokes: revert.
    function test_revertAfterRevoke() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        _exec(p, _sign(p), 1e6, 1); // approved + first buy
        vm.prank(wallet);
        spm.revoke(p);
        vm.prank(agent);
        vm.expectRevert();
        ex.execute(p, "", 1e6, NVDA, 1, address(router), _swapData(1e6), block.timestamp + 300);
    }

    /// 7. Paused: revert.
    function test_revertWhenPaused() public {
        vm.prank(owner);
        ex.pause();
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert(SahmExecutor.IsPaused.selector);
        ex.execute(p, sig, FIVE, NVDA, 1, address(router), _swapData(FIVE), block.timestamp + 300);
    }

    /// 8. Router delivers less than minOut: revert.
    function test_revertWhenRouterShortChanges() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        // Honest quote first, on a snapshot.
        uint256 snap = vm.snapshotState();
        _exec(p, _sign(p), FIVE, 1);
        uint256 honestOut = IERC20(NVDA).balanceOf(wallet);
        vm.revertToState(snap);

        router.setSkim(100); // router keeps 1%
        uint256 minOut = honestOut * 9_950 / 10_000; // agent allows 0.5% slippage
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert();
        ex.execute(p, sig, FIVE, NVDA, minOut, address(router), _swapData(FIVE), block.timestamp + 300);
    }

    /// 9. Two buys on the same day inside the cap: both succeed, signature only needed once.
    function test_twoBuysSameDayWithinCap() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        _exec(p, _sign(p), FIVE, 1);
        uint256 afterFirst = IERC20(NVDA).balanceOf(wallet);
        vm.warp(vm.getBlockTimestamp() + 1 hours);
        _exec(p, "", FIVE, 1);
        assertGt(IERC20(NVDA).balanceOf(wallet), afterFirst);
        assertEq(spm.getCurrentPeriod(p).spend, DAILY_CAP);
        // A third buy the same day would exceed the cap.
        vm.prank(agent);
        vm.expectRevert();
        ex.execute(p, "", 1e6, NVDA, 1, address(router), _swapData(1e6), block.timestamp + 300);
    }

    /// Extra: expired deadline reverts; unused USDC is refunded.
    function test_revertWhenExpired() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        bytes memory sig = _sign(p);
        vm.prank(agent);
        vm.expectRevert(SahmExecutor.Expired.selector);
        ex.execute(p, sig, FIVE, NVDA, 1, address(router), _swapData(FIVE), block.timestamp - 1);
    }

    function test_refundsUnusedUsdc() public {
        ISpendPermissionManager.SpendPermission memory p = _perm();
        uint256 usdcBefore = IERC20(USDC).balanceOf(wallet);
        bytes memory sig = _sign(p);
        vm.prank(agent);
        // Pull $5 but the route only swaps $3 -> $2 must come back.
        ex.execute(p, sig, FIVE, NVDA, 1, address(router), _swapData(3e6), block.timestamp + 300);
        assertEq(IERC20(USDC).balanceOf(wallet), usdcBefore - 3e6);
        assertEq(IERC20(USDC).balanceOf(address(ex)), 0);
    }

    function test_onlyOwnerAdmin() public {
        vm.expectRevert(SahmExecutor.NotOwner.selector);
        ex.setAgent(address(1));
        vm.expectRevert(SahmExecutor.NotOwner.selector);
        ex.setStock(MSFT, true);
        vm.prank(owner);
        vm.expectRevert(SahmExecutor.RouterNotAllowed.selector);
        ex.setRouter(USDC, true);
    }
}
