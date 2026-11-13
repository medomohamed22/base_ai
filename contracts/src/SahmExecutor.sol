// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ISpendPermissionManager} from "./interfaces/ISpendPermissionManager.sol";

interface IERC20 {
    function balanceOf(address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
}

/// @title SahmExecutor
/// @notice Buys an allow-listed tokenized stock for a user in one atomic transaction:
///         pull USDC with the user's Spend Permission -> swap on an allow-listed router ->
///         the stock lands directly in the user's wallet. This contract never keeps a balance.
/// @dev    Only the agent can call `execute`. The user caps spending on-chain (allowance per period,
///         end date) and can revoke at any time through the SpendPermissionManager.
contract SahmExecutor {
    ISpendPermissionManager public immutable SPM;
    address public immutable USDC;

    address public owner;
    address public pendingOwner;
    address public agent;
    bool public paused;
    mapping(address => bool) public allowedStock;
    mapping(address => bool) public allowedRouter;

    uint256 private _locked = 1;

    event Executed(address indexed user, address indexed stock, uint256 usdcIn, uint256 stockOut, uint256 refund);
    event AgentSet(address indexed agent);
    event StockSet(address indexed stock, bool allowed);
    event RouterSet(address indexed router, bool allowed);
    event Paused(bool paused);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotAgent();
    error IsPaused();
    error Expired();
    error StockNotAllowed();
    error RouterNotAllowed();
    error BadPermission();
    error ZeroAmount();
    error SwapFailed(bytes reason);
    error InsufficientOutput(uint256 out, uint256 minOut);
    error TransferFailed();
    error Reentrancy();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(address spm, address usdc, address owner_, address agent_) {
        if (spm == address(0) || usdc == address(0) || owner_ == address(0)) revert ZeroAddress();
        SPM = ISpendPermissionManager(spm);
        USDC = usdc;
        owner = owner_;
        agent = agent_;
        emit OwnershipTransferred(address(0), owner_);
        emit AgentSet(agent_);
    }

    /// @param p         The user's spend permission (spender must be this contract, token must be USDC).
    /// @param signature Non-empty only on the first buy: the user's signature over `p`.
    /// @param amount    USDC to spend (6 decimals).
    /// @param stock     Tokenized stock to buy (must be allow-listed).
    /// @param minOut    Minimum stock the user must receive (from the agent's guarded quote).
    /// @param router    Allow-listed swap router.
    /// @param swapData  Router calldata. Its recipient must be `p.account`.
    /// @param deadline  Unix time after which the call reverts.
    function execute(
        ISpendPermissionManager.SpendPermission calldata p,
        bytes calldata signature,
        uint160 amount,
        address stock,
        uint256 minOut,
        address router,
        bytes calldata swapData,
        uint256 deadline
    ) external nonReentrant onlyAgent whenNotPaused {
        if (block.timestamp > deadline) revert Expired();
        if (!allowedStock[stock]) revert StockNotAllowed();
        if (!allowedRouter[router]) revert RouterNotAllowed();
        if (p.spender != address(this) || p.token != USDC) revert BadPermission();
        if (amount == 0) revert ZeroAmount();

        if (signature.length != 0 && !SPM.isApproved(p)) {
            SPM.approveWithSignature(p, signature);
        }

        address user = p.account;
        uint256 usdcBefore = IERC20(USDC).balanceOf(address(this));
        uint256 stockBefore = IERC20(stock).balanceOf(user);

        SPM.spend(p, amount);
        _swap(router, amount, swapData);

        uint256 out = IERC20(stock).balanceOf(user) - stockBefore;
        if (out < minOut) revert InsufficientOutput(out, minOut);

        uint256 refund = _refund(user, usdcBefore);
        emit Executed(user, stock, amount - refund, out, refund);
    }

    function _swap(address router, uint256 amount, bytes calldata swapData) private {
        _approve(router, amount);
        (bool ok, bytes memory ret) = router.call(swapData);
        if (!ok) revert SwapFailed(ret);
        _approve(router, 0);
    }

    function _refund(address user, uint256 usdcBefore) private returns (uint256 refund) {
        refund = IERC20(USDC).balanceOf(address(this)) - usdcBefore;
        if (refund != 0 && !IERC20(USDC).transfer(user, refund)) revert TransferFailed();
    }

    // ---------------------------------------------------------------- admin

    function setAgent(address agent_) external onlyOwner {
        agent = agent_;
        emit AgentSet(agent_);
    }

    function setStock(address stock, bool allowed) external onlyOwner {
        allowedStock[stock] = allowed;
        emit StockSet(stock, allowed);
    }

    function setRouter(address router, bool allowed) external onlyOwner {
        if (router == USDC || router == address(SPM)) revert RouterNotAllowed();
        allowedRouter[router] = allowed;
        emit RouterSet(router, allowed);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(true);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Paused(false);
    }

    /// @notice Sweeps dust. The contract is never meant to hold funds between transactions.
    function rescue(address token, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = IERC20(token).balanceOf(address(this));
        if (bal != 0 && !IERC20(token).transfer(to, bal)) revert TransferFailed();
    }

    function transferOwnership(address newOwner) external onlyOwner {
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotOwner();
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    function _approve(address spender, uint256 value) private {
        if (!IERC20(USDC).approve(spender, value)) revert TransferFailed();
    }
}
