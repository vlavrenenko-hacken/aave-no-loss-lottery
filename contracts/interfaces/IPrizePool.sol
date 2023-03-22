// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** @title  IPrizePool
  * @author vvlnko
  * @notice The YieldSourcePrizePool interface.
*/
interface IPrizePool {
    /// @notice Deposit assets into the YieldSource in exchange for tokens.
    /// @dev Can only be called by the Lottery.
    /// @param to The address receiving the shares.
    /// @param amount The amount of assets to deposit.
    function depositTo(address to, uint256 amount) external;

    /// @notice Withdraw assets from the YieldSource.
    /// @dev Can only be called by the Lottery.
    /// @param from The tokens owner's address.
    /// @param to The address receiving a specific number of deposited tokens.
    /// @param amount The number of tokens to be withdrawn.
    function withdrawFrom(address from, address to, uint256 amount) external;

    /// @notice Claim interest accrued from deposits to the YieldSource.
    /// @dev Can only be called by the PrizeStrategy contract.
    function claimInterest() external;

    /// @notice Return the total balance.
    /// @dev Return the total number of deposited funds + any accrued interest.
    /// @return  The underlying balance of assets.
    function balance() external returns (uint256);

    /// @notice Return the number of shares a user received.
    /// @dev The number of shares equals to the number of deposited tokens.
    /// @param user The address of the user, whose balance will be returned.
    /// @return The number of deposited assets by a user.
    function balanceOfUser(address user) external view returns(uint256);

    /// @notice Return the total interest.
    /// @dev The total interest equals zero, if nothing was deposited.
    /// @return The total number of accrued interest.
    function getInterest() external view returns (uint256);

    /// @notice Return the address of the token used for deposits.
    /// @return Address of the deposit token.
    function getToken() external view returns (IERC20);
}