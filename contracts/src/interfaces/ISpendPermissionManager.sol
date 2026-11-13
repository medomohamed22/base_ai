// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Minimal interface of Coinbase's SpendPermissionManager
///         (deployed at 0xf85210B21cC50302F477BA56686d2019dC9b67Ad on Base and Base Sepolia).
interface ISpendPermissionManager {
    struct SpendPermission {
        address account;
        address spender;
        address token;
        uint160 allowance;
        uint48 period;
        uint48 start;
        uint48 end;
        uint256 salt;
        bytes extraData;
    }

    struct PeriodSpend {
        uint48 start;
        uint48 end;
        uint160 spend;
    }

    function approve(SpendPermission calldata spendPermission) external returns (bool);
    function approveWithSignature(SpendPermission calldata spendPermission, bytes calldata signature)
        external
        returns (bool);
    function spend(SpendPermission calldata spendPermission, uint160 value) external;
    function revoke(SpendPermission calldata spendPermission) external;
    function isApproved(SpendPermission calldata spendPermission) external view returns (bool);
    function isRevoked(SpendPermission calldata spendPermission) external view returns (bool);
    function isValid(SpendPermission calldata spendPermission) external view returns (bool);
    function getHash(SpendPermission calldata spendPermission) external view returns (bytes32);
    function getCurrentPeriod(SpendPermission calldata spendPermission) external view returns (PeriodSpend memory);
}
