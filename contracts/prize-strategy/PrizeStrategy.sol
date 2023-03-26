// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/IPrizePool.sol";
import "../interfaces/ILottery.sol";

contract PrizeStrategy is IStrategy, Ownable {
    
    ///@notice PrizePool address. 
    IPrizePool prizePool;

    // @notice Lottery address.
    ILottery lottery;

    /**
     * @dev Throws if called by any account other than the Lottery.
     */
    modifier onlyLottery {
        require(msg.sender == address(lottery), "PrizeStrategy/not-lottery");
        _;
    }

    /// @notice Distributes the prize to the winner of the lottery.
    /// @dev Selects a random winner from the passed list of participants and transfer the prize to the winner. Can only be called by the Lottery.
    /// @return winner The winner of the lottery.
    /// @return prize The prize the winner will receive.
    function distribute(address[] memory participants) external onlyLottery returns (address winner, uint256 prize) {
        require(address(prizePool) != address(0), "PrizeStrategy/prizePool-address-not-zero");
        prizePool.claimInterest();
        IERC20 prizeToken = prizePool.getToken();
        prize = prizeToken.balanceOf(address(this));
        winner = _getWinner(participants);
        prizeToken.transfer(winner, prize);
    }

    /// @notice Set the address of the YieldSourcePrizePool.
    /// @dev Can only be called by PrizeStrategy's owner.
    function setPrizePool(IPrizePool _prizePool) external onlyOwner {
        require(address(_prizePool) != address(0), "PrizeStrategy/_prizePool-address-not-zero");
        prizePool = _prizePool;
    }

    /// @notice Set the address of the Lottery.
    /// @dev Can only be called PrizeStrategy's owner.
    function setLottery(ILottery _lottery) external onlyOwner {
        require(address(_lottery) != address(0), "PrizeStrategy/_lottery-address-not-zero");
        lottery = _lottery;
    }

    /// @notice Returns the address of the PrizePool contract.
    /// @return The address of the PrizePool contract.
    function getPrizePool() external view returns (IPrizePool) {
        return prizePool;
    }

    /// @notice Returns the address of the Lottery contract.
    /// @dev New lottery can be created, so the address should be changed.
    /// @return The address of the Lottery contract.
    function getLottery() external view returns (ILottery) {
        return lottery;
    }

    /// @notice Returns the potential prize of the lottery.
    /// @dev Returns  the potenial prize of the lottery which equals to the total accrued interest.
    /// @return The prize of the lottery.
    function getPrize() external view returns (uint256) {
        return prizePool.getInterest();
    }

    /// @notice Returns the winner of the lottery.
    /// @param participants The array containing addresses of lottery participants.
    /// @return winner The address of the lottery winner.
    function _getWinner(address[] memory participants) private view returns (address winner) {
        winner = participants[block.prevrandao % participants.length];
    }
}