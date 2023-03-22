// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** @title  IYieldSource
  * @author vvlnko
  * @notice The ATokenYieldSource interface.
*/
interface IYieldSource is IERC20 {

    /// @notice Supply tokens to the yield source.
    /// @param from Address of the entity depositing tokens to the pool.
    /// @param to Address of the user receiving the shares of the pool.
    /// @param mintAmount Amount of deposited tokens.
    function supplyTokenTo(address from, address to, uint256 mintAmount) external;

    /// @notice Redeem tokens from the yield source.
    /// @param from Address of the entity withdrawing shares from.
    /// @param to Address of the entity that will receive the deposited tokens.
    /// @param amount Amount of tokens to be redeemed.
    function redeemToken(address from, address to, uint256 amount) external;

    /// @notice Withdraw accrued interest from the yieldSource.
    /// @param to Address of an account that will receive the interest.
    /// @return True if operation was successful.
    function withdrawInterest(address to) external returns (bool);

    /// @notice Returns the ERC20 asset token used for deposits.
    /// @return The ERC20 asset token address.
    function depositToken() external view returns (address);

    /// @notice Return the total number of deposited funds along with accrued interest.
    /// @return The uin256 value of totalBalance.
    function totalBalance() external view returns (uint256);

    /// @notice Return the total accrued interest.
    /// @return The uin256 value of total accrued interest.
    function getTotalInterest() external view returns (uint256);
}