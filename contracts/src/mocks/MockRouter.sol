// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MockStock} from "./MockStock.sol";

interface IERC20Min {
    function transferFrom(address, address, uint256) external returns (bool);
}

/// @notice TESTNET ONLY. "Swaps" USDC for a MockStock at a fixed price set by the owner.
///         The USDC it receives stays here (testnet USDC has no value).
contract MockRouter {
    address public immutable usdc;
    address public immutable owner;
    MockStock public immutable stock;
    /// USDC (6 decimals) per 1 whole share.
    uint256 public priceUsdc;

    /// @dev `owner_` is explicit so the router can be deployed through a CREATE2 factory.
    constructor(address usdc_, address owner_, uint256 priceUsdc_, string memory name_, string memory symbol_) {
        usdc = usdc_;
        owner = owner_;
        priceUsdc = priceUsdc_;
        stock = new MockStock(name_, symbol_, address(this));
    }

    function setPrice(uint256 p) external {
        require(msg.sender == owner, "owner");
        priceUsdc = p;
    }

    function quote(uint256 amountIn) public view returns (uint256) {
        return amountIn * 1e8 / priceUsdc;
    }

    /// Same shape as a real aggregator call: pulls tokenIn from msg.sender, sends the stock to `recipient`.
    function swapExactIn(uint256 amountIn, address recipient) external returns (uint256 out) {
        require(IERC20Min(usdc).transferFrom(msg.sender, address(this), amountIn), "pull");
        out = quote(amountIn);
        stock.mint(recipient, out);
    }
}
