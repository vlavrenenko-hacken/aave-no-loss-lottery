// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IYieldSource.sol";
import "../interfaces/IPrizePool.sol";
import "../interfaces/IStrategy.sol";
import "../interfaces/ILottery.sol";

/** @title  YieldSourcePrizePool
  * @author vvlnko
  * @notice The YieldSourcePrizePool contract to interact with the yieldSource.
*/
contract YieldSourcePrizePool is IPrizePool, ReentrancyGuard  {
    /// @notice SafeERC20 library for safe ERC20 interactions.
    using SafeERC20 for IERC20;

    /// @notice Address library with additional functionality for address type.
    using Address for address;

    /// @notice Address of the yield source.
    IYieldSource public immutable yieldSource;

    /// @notice Address of the prizeStrategy.
    IStrategy public immutable prizeStrategy;

    /// @notice Address of the lottery contract.
    ILottery public immutable lottery;

    /// @dev Emitted when the contract is deployed
    event Deployed(address indexed yieldSource, address indexed prizeStrategy, address indexed lottery);

    /// @notice Deploy the YieldSourcePrizePool contract.
    /// @param _yieldSource Address of the yieldSource.
    /// @param _prizeStrategy Address of the prizeStrategy.
    /// @param _lottery Address of the lottery.
    constructor(IYieldSource _yieldSource, IStrategy _prizeStrategy, ILottery _lottery) {

        yieldSource = _yieldSource;
        prizeStrategy = _prizeStrategy;
        lottery = _lottery;

        emit Deployed(address(_yieldSource), address(_prizeStrategy), address(_lottery));
    }

    /**
     * @dev Throws if called by any account other than the lottery.
     */
    modifier onlyLottery {
        require(msg.sender == address(lottery), "YieldSourcePrizePool/not-lottery");
        _;
    }

    /**
     * @dev Throws if called by any account other than the prizeStrategy.
     */
    modifier onlyStrategy {
        require(msg.sender == address(prizeStrategy), "YieldSourcePrizePool/not-strategy");
        _;
    }

    /// @notice Deposit assets into the YieldSource in exchange for tokens.
    /// @dev Can only be called by the Lottery.
    /// @param to The address receiving the shares.
    /// @param amount The amount of assets to deposit.
    function depositTo(address to, uint256 amount) external onlyLottery nonReentrant {
        require(to != address(0), "YieldSourcePrizePool/to-not-zero-address");
        _requireTokensGTZero(amount);
        IERC20(this.getToken()).safeApprove(address(yieldSource), amount);
        yieldSource.supplyTokenTo(address(this), to, amount);
    }

    /// @notice Withdraw assets from the YieldSource.
    /// @dev Can only be called by the Lottery.
    /// @param from The tokens owner's address.
    /// @param to The address receiving a specific number of deposited tokens.
    /// @param amount The number of tokens to be withdrawn.
    function withdrawFrom(address from, address to, uint256 amount) external onlyLottery nonReentrant {
        require(from != address(0), "YieldSourcePrizePool/from-not-zero-address");
        require(to != address(0), "YieldSourcePrizePool/to-not-zero-address");
        _requireTokensGTZero(amount);
        yieldSource.redeemToken(from, to, amount);
    }

    /// @notice Claim interest accrued from deposits to the YieldSource.
    /// @dev Can only be called by the PrizeStrategy contract.
    function claimInterest() onlyStrategy nonReentrant external {
        yieldSource.withdrawInterest(msg.sender);
    }

    /// @notice Return the total balance.
    /// @dev Return the total number of deposited funds + any accrued interest.
    /// @return  The underlying balance of assets. 
    function balance() external view returns (uint256) {
        return yieldSource.totalBalance();
    }

    /// @notice Return the number of shares a user received.
    /// @dev The number of shares equals to the number of deposited tokens.
    /// @param user The address of the user, whose balance will be returned.
    /// @return The number of deposited assets by a user.
    function balanceOfUser(address user) external view returns(uint256) {
        return yieldSource.balanceOf(user);
    }

    /// @notice Return the total interest.
    /// @dev The total interest equals zero, if nothing was deposited.
    /// @return The total number of accrued interest.
    function getInterest() external view returns (uint256) {
        return yieldSource.getTotalInterest();
    }

    /// @notice Return the address of the token used for deposits.
    /// @return Address of the deposit token.
    function getToken() external view returns (IERC20) {
        return IERC20(yieldSource.depositToken());
    }

    /// @notice Check whether the passed number of tokens is greater than zero.
    function _requireTokensGTZero(uint256 _tokens) internal pure {
    require(_tokens > 0, "YieldSourcePrizePool/tokens-gt-zero");
  }
}