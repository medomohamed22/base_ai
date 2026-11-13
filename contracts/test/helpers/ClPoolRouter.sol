// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IClPool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external
        returns (int256, int256);
}

interface IERC20Like {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}

/// @notice Test-only router: exact-in swap on a single Aerodrome Slipstream (Uniswap-v3 style) pool.
///         Mirrors how a real aggregator behaves: pulls tokenIn from msg.sender, sends tokenOut to `recipient`.
contract ClPoolRouter {
    uint160 internal constant MIN_SQRT = 4295128740;
    uint160 internal constant MAX_SQRT = 1461446703485210103287273052203988822378723970341;

    /// @dev When > 0, the router keeps this many basis points of the output (simulates a bad router).
    uint256 public skimBps;
    address private _payer;
    address private _pool;

    function setSkim(uint256 bps) external {
        skimBps = bps;
    }

    function swapExactIn(address pool, address tokenIn, uint256 amountIn, address recipient) external {
        bool zeroForOne = IClPool(pool).token0() == tokenIn;
        _payer = msg.sender;
        _pool = pool;
        address to = skimBps == 0 ? recipient : address(this);
        (int256 a0, int256 a1) =
            IClPool(pool).swap(to, zeroForOne, int256(amountIn), zeroForOne ? MIN_SQRT : MAX_SQRT, abi.encode(tokenIn));
        _pool = address(0);
        if (skimBps != 0) {
            uint256 out = uint256(-(zeroForOne ? a1 : a0));
            address tokenOut = zeroForOne ? IClPool(pool).token1() : IClPool(pool).token0();
            IERC20Like(tokenOut).transfer(recipient, out - (out * skimBps) / 10_000);
        }
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external {
        require(msg.sender == _pool, "pool");
        address tokenIn = abi.decode(data, (address));
        uint256 pay = uint256(amount0Delta > 0 ? amount0Delta : amount1Delta);
        IERC20Like(tokenIn).transferFrom(_payer, msg.sender, pay);
    }
}
