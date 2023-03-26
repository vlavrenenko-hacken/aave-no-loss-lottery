// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {ATokenInterface, IAToken} from "../interfaces/ATokenInterface.sol";
import "../interfaces/IYieldSource.sol";
import "hardhat/console.sol";

contract ATokenYieldSource is ERC20, Ownable, IYieldSource {
    
    /// @notice SafeERC20 for tokens having IERC20 implemented.
    using SafeERC20 for IERC20;
    
    /// @notice Address of the aToken. 
    ATokenInterface public immutable aToken;

    /// @notice Address of the poolAddressesProvider.
    IPoolAddressesProvider public immutable poolAddressesProvider;

    /// @notice Address of the deposited token.
    address private immutable tokenAddress;

    /// @notice Number of decimals the shares token has.
    /// @dev It should equal to the decimals of the deposited token.
    uint8 private immutable __decimals;  

    /// @dev Emitted when the ATokenYieldSource is created.
    /// @param aToken Address of the IAToken contract.
    /// @param poolAddressesProvider Address of the poolAddressesProvider.
    /// @param decimals Decimals of the token used for shares.
    /// @param name Name of the token used for shares.
    /// @param symbol Symbol of the token used for shares.
    /// @param owner Owner of the ATokenYieldSource.
    event ATokenYieldSourceInitialized(
        IAToken indexed aToken,
        IPoolAddressesProvider poolAddressesProvider,
        uint8 decimals,
        string name,
        string symbol,
        address owner
  );
 
  /// @notice Emitted when Aave compound have been claimed.
  /// @param claimer Address of the account receving the accrued interest.
  /// @param amount The interest the claimer will receive.
  event Claimed(
    address indexed claimer,
    uint256 amount
  );

  /// @notice Emitted when asset tokens are supplied to the yield source.
  /// @param from Address of the account deposited assets.
  /// @param sharesTo Address of the account that will receive the shares.
  /// @param aTokensTo Address of the account that received the deposited assets.
  /// @param amountSharesMinted Number of shares to address will receive.
  /// @param aTokensAmountMinted Number of aTokens to address will receive.
  event SuppliedTokenTo(
    address indexed from,
    address indexed sharesTo,
    address indexed aTokensTo,
    uint256 amountSharesMinted,
    uint256 aTokensAmountMinted
  );

  /// @notice Emitted when asset tokens are redeemed from the yield source.
  /// @param sharesFrom Address from what the shares tokens will be substracted.
  /// @param daiTo Address to which the redeemed DAI will be transfered.
  /// @param sharesBurned Amount of shares tokens that will be burnt.
  /// @param daiAmountRedeemed Amount of DAI that will be redeemed.
  event RedeemedToken(
    address indexed sharesFrom,
    address indexed daiTo,
    uint256 sharesBurned,
    uint256 daiAmountRedeemed
  );

  /// @notice Deploy the ATokenYieldSource contract.
  /// @param _aToken Address of the aToken
  /// @param _poolAddressesProvider Address of the poolAddressesProvider.
  /// @param _decimals Decimals of the token used for shares.
  /// @param _symbol Symbol of the token used for shares.
  /// @param _name Name of the token used for shares.
  constructor (
    ATokenInterface _aToken,
    IPoolAddressesProvider _poolAddressesProvider,
    uint8 _decimals,
    string memory _symbol,
    string memory _name
  ) ERC20(_name, _symbol)
  {
    require(address(_aToken) != address(0), "ATokenYieldSource/aToken-not-zero-address");
    require(address(_poolAddressesProvider) != address(0), "ATokenYieldSource/poolAddressesProvider-not-zero-address");
    
    address UNDERLYING_ASSET_ADDRESS = _aToken.UNDERLYING_ASSET_ADDRESS();
    uint aDecimals = IERC20Metadata(UNDERLYING_ASSET_ADDRESS).decimals();
    require(aDecimals == _decimals, "ATokenYieldSource/decimals-are-different");
    
    aToken = _aToken;
    poolAddressesProvider = _poolAddressesProvider;
    __decimals = _decimals;

    address _tokenAddress = address(UNDERLYING_ASSET_ADDRESS);
    tokenAddress = _tokenAddress;

    // Approve once for max amount
    IERC20(tokenAddress).safeApprove(address(_lendingPool()), type(uint256).max);

    emit ATokenYieldSourceInitialized (
      _aToken,
      _poolAddressesProvider,
      _decimals,
      _name,
      _symbol,
      msg.sender
    );
  }

  /// @notice Returns the number of decimals that the token repesenting yield source shares has.
  /// @return The number of decimals used by shares token.
  function decimals() public override view returns (uint8) {
    return __decimals;
  }

   /// @notice Returns the ERC20 asset token used for deposits.
   /// @return The ERC20 asset token address.
  function depositToken() public view override returns (address) {
    return tokenAddress;
  }

  /// @notice The total aBalance including deposited tokens and accrued interest.
  /// @return Total number of aToken.
  function totalBalance() external view returns (uint256) {
    return aToken.balanceOf(address(this));
  }

  /// @notice Supplies asset tokens to the yield source
  /// @dev Shares corresponding to the number of tokens supplied are mint to the user's balance
  /// @dev Asset tokens are supplied to the yield source, then deposited into Aave
  /// @param mintAmount The amount of asset tokens to be supplied
  /// @param to The user whose balance will receive the tokens
  function supplyTokenTo(address from, address to, uint256 mintAmount) external onlyOwner {
    require(from != address(0), "ATokenYieldSource/sender-not-zero-address");
    require(to != address(0), "ATokenYieldSource/receiver-not-zero-address");
    _requireTokensGTZero(mintAmount);

    _depositToAave(from, mintAmount);
    _mint(to, mintAmount);

    emit SuppliedTokenTo(from, to, address(this), mintAmount, mintAmount);
  }

  /// @notice Redeems asset tokens from the yield source
  /// @dev Shares corresponding to the number of tokens withdrawn are burnt from the user's balance
  /// @dev Asset tokens are withdrawn from Aave, then transferred from the yield source to the user's wallet
  /// @param redeemAmount The amount of asset tokens to be redeemed
function redeemToken(address from, address to, uint256 redeemAmount) external onlyOwner {
    require(from != address(0), "ATokenYieldSource/sender-not-zero-address");
    require(to != address(0), "ATokenYieldSource/receiver-not-zero-address");
    _requireTokensGTZero(redeemAmount);
    _burn(from, redeemAmount);

    IERC20 _depositToken = IERC20(tokenAddress);
    uint256 beforeBalance = _depositToken.balanceOf(to);
    _lendingPool().withdraw(tokenAddress, redeemAmount, to);
    uint256 afterBalance = _depositToken.balanceOf(to);
    uint256 balanceDiff = afterBalance - beforeBalance;

    emit RedeemedToken(from, to, redeemAmount, balanceDiff);
  }

 /// @notice Claims the accrued rewards for the aToken, accumulating any pending rewards.
  /// @param to Address where the claimed rewards will be sent.
  /// @return True if operation was successful.
  function withdrawInterest(address to) external onlyOwner returns (bool) {
    require(to != address(0), "ATokenYieldSource/recipient-not-zero-address");
    
    uint256 _amountAccrued = aToken.balanceOf(address(this)) - totalSupply();
    _lendingPool().withdraw(tokenAddress, _amountAccrued, to);
    emit Claimed(to, _amountAccrued);
    return true;
  }

  function getTotalInterest() external view returns (uint256) {
    uint256 _amountAccrued = aToken.balanceOf(address(this)) - totalSupply();
    return _amountAccrued;
  }

  /// @notice Retrieves Aave LendingPool address
  /// @return A reference to LendingPool interface
  function _lendingPool() internal view returns (IPool) {
    return IPool(
      poolAddressesProvider.getPool()
    );
  }

   /// @notice Function is used to ensure that the passed number of tokens are greater than zero.
   /// @param _tokens The passed number of tokens to be checked.
  function _requireTokensGTZero(uint256 _tokens) internal pure {
    require(_tokens > 0, "ATokenYieldSource/tokens-gt-zero");
  }

  /// @notice Deposits asset tokens to Aave.
  /// @param from Address of the depositor.
  /// @param mintAmount The amount of asset tokens to be deposited.
  function _depositToAave(address from, uint256 mintAmount) internal {
    IERC20(tokenAddress).safeTransferFrom(from, address(this), mintAmount);
    _lendingPool().supply(tokenAddress, mintAmount, address(this), 0);
  }
}