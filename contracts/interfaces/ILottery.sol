// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../interfaces/IStrategy.sol";

/** @title  ILottery
  * @author vvlnko
  * @notice The Lottery interface.
*/
interface ILottery {
    /// @notice Called in the LotteryFactory to initialize a new lottery.
    /// @dev Cannot be called twice.
    /// @param _owner The address of the entity controlling a lottery.
    /// @param _tokenAddress The address of the token being used as a ticket for a lottery.
    /// @param _ticketPrice The price in tokens every new participant has to pay to enter a lottery.
    /// @param _interval The period of time a lottery lasts.
    function initialize(address _owner, address _tokenAddress, uint _ticketPrice, uint _interval) external;

    /// @notice Called when a user wants to participate in a lottery.
    /// @dev  Cannot be called when the lottery is closed.
    /// @dev To participate in a lottery, a user needs to approve the speicific amount of tokens equal to the _ticketPrice.
    function participate() external;

    /// @notice Called to select the winner of a lottery and to distribute the prize.
    /// @dev  Cannot be called until the lottery is not closed.
    function pickWinner() external;

    /// @notice Called to withdraw the deposited amount of tokens.
    /// @dev  Cannot be called until the lottery is closed.
    function withdraw(uint256 amount) external;

    /// @notice Used to set the address of the prizeStrategy contract.
    /// @dev Can be called only by the owner of the lottery.
    /// @dev Must be called before calling any other functions.
    function setPrizeStrategy(IStrategy _strategy) external;

    /// @notice Used to set the address of the prizePool contract.
    /// @dev Can be called only by the owner of the lottery.
    /// @dev Must be called before calling any other functions.
    function setPrizePool(IPrizePool _prizePool) external;

    /// @notice Used to get the prize accumulated since the beginning of the lottery.
    /// @dev Can be called until the lottery is closed. 
    /// @dev The returning value equals to the interest accrued from participants' deposits to the yieldSource.
    /// @dev The prize is not stable.
    /// @return Returns the future prize of the lottery
    function getFuturePrize() external view returns (uint256);
}