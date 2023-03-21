// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;
import "../interfaces/IPrizePool.sol";

/** @title  IStrategy
  * @author vvlnko
  * @notice The PrizeStrategy interface.
*/
interface IStrategy {

    /// @notice Distributes the prize to the winner of the lottery.
    /// @dev Selects a random winner from the passed list of participants and transfer the prize to the winner.
    /// @return winner The winner of the lottery.
    /// @return prize The prize the winner will receive.
    function distribute(address[] memory participants) external returns (address winner, uint256 prize);

    /// @notice Set the address of the YieldSourcePrizePool.
    /// @dev Can only be called by PrizeStrategy's owner.
    function setPrizePool(IPrizePool _prizePool) external;

    /// @notice Returns the address of the PrizePool contract.
    /// @return The address of the PrizePool contract.
    function getPrizePool() external view returns (IPrizePool);

    /// @notice Returns the potential prize of the lottery.
    /// @dev Returns  the potenial prize of the lottery which equals to the total accrued interest.
    /// @return The prize of the lottery.
    function getPrize() external view returns (uint256);

}