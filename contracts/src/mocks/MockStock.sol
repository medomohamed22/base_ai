// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice TESTNET ONLY. Minimal 8-decimal ERC-20 that mimics a Coinbase tokenized stock (incl. uiMultiplier).
///         Only the minter (the mock router) can mint.
contract MockStock {
    string public name;
    string public symbol;
    uint8 public constant decimals = 8;
    uint256 public totalSupply;
    uint256 public constant uiMultiplier = 1e18;
    address public immutable minter;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, address minter_) {
        name = name_;
        symbol = symbol_;
        minter = minter_;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "minter");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _move(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        return _move(from, to, amount);
    }

    function _move(address from, address to, uint256 amount) private returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
