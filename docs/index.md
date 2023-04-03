# Solidity API

## Lottery

The Lottery contract with the functionality for participation, winner selection, withdrawal in case of not being selected as the winner as well as getting the potential prize.

### isParticipated

```solidity
mapping(address => bool) isParticipated
```

_A mapping that stores the participants of the lottery.
Input. The address of a participator.
Return. The bool value which indicates whether a user participated in the lottery or not._

### participants

```solidity
address[] participants
```

_An array that stores addresses of lottery participants._

### owner

```solidity
address owner
```

The owner of the lottery

_It is set via the minimal proxy._

### lotteryFactory

```solidity
address lotteryFactory
```

The address of the LotteryFactory.

_LotteryFactory is responsible for the creation of new lotteries._

### token

```solidity
contract IERC20 token
```

The address of the token that is deposited to the lottery.

_It is deposited to the YieldSource in exchange of ATokens._

### prizePool

```solidity
contract IPrizePool prizePool
```

The address of the PrizePool.

_The PrizePool is used by the lottery to deposit/withdraw tokens._

### strategy

```solidity
contract IStrategy strategy
```

The address of the PrizeStrategy.

_The PrizeStrategy is used by the Lottery to distribute the prize._

### interval

```solidity
uint256 interval
```

The interval which indicates how long a lottery lasts.

_A lottery is closed when the time plus interval is over._

### ticketPrice

```solidity
uint256 ticketPrice
```

The price of a ticket.

_It must be paid to participate in a lottery._

### deadline

```solidity
uint256 deadline
```

The deadline of a lottery.

_It is initialized automatically when a first participant calls the pariticipate function._

### winner

```solidity
address winner
```

The winner of a lottery.

_It is chosen by the PrizeStrategy._

### prize

```solidity
uint256 prize
```

The prize of a lottery.

_Equals to the total accrued interest._

### Deposited

```solidity
event Deposited(address player, uint256 amount)
```

Emitted when a new participant deposits funds to a lottery.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| player | address | The address of a participant. |
| amount | uint256 | The amount of deposited funds. |

### onlyOwner

```solidity
modifier onlyOwner()
```

_Throws if called by any account other than the owner._

### initialize

```solidity
function initialize(address _owner, address _tokenAddress, uint256 _ticketPrice, uint256 _interval) external
```

The initialize function is used to initialize the Lottery with the necessary data.

_The function is called only once by the LotteryFactory via the MinimalProxy_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The owner of the lottery |
| _tokenAddress | address | The address of the token that will be used as the ticket in a lottery |
| _ticketPrice | uint256 | The price a user has to pay to participate in a lottery |
| _interval | uint256 | This is how long a lottery will be open |

### setPrizePool

```solidity
function setPrizePool(contract IPrizePool _prizePool) external
```

Sets the address of the PrizePool contract.

_Can only be called by the owner of the contract and the address must be set before using any other functions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _prizePool | contract IPrizePool | The address of the PrizePool contract. |

### setPrizeStrategy

```solidity
function setPrizeStrategy(contract IStrategy _strategy) external
```

Sets the address of the PrizeStrategy contract.

_Can only be called by the owner and the address must be set before using any other functions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _strategy | contract IStrategy | The address of the PrizeStrategy contract. |

### participate

```solidity
function participate() external
```

The function is used to participate in the lottery.

_Cannot be called when the lottery is closed or the address of the PrizePool contract is not set._

### pickWinner

```solidity
function pickWinner() external
```

The function is called to pick the winner of the lottery.

_The function fails if the lottery is not started or not closed yet._

### withdraw

```solidity
function withdraw(uint256 amount) external
```

Withdraws the deposited assets.

_The function fails if the lottery is not started or not closed yet._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The number of tokens to be withdrawn. |

### getFuturePrize

```solidity
function getFuturePrize() external view returns (uint256)
```

Returns the potential prize the lottery winner will have.

_The function fails if the lottery is not started or closed. The potenital prize is not stable. It accumulates._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The uint256 prize value. |

## ILottery

The Lottery interface.

### initialize

```solidity
function initialize(address _owner, address _tokenAddress, uint256 _ticketPrice, uint256 _interval) external
```

Called in the LotteryFactory to initialize a new lottery.

_Cannot be called twice._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The address of the entity controlling a lottery. |
| _tokenAddress | address | The address of the token being used as a ticket for a lottery. |
| _ticketPrice | uint256 | The price in tokens every new participant has to pay to enter a lottery. |
| _interval | uint256 | The period of time a lottery lasts. |

### participate

```solidity
function participate() external
```

Called when a user wants to participate in a lottery.

_Cannot be called when the lottery is closed.
To participate in a lottery, a user needs to approve the speicific amount of tokens equal to the _ticketPrice._

### pickWinner

```solidity
function pickWinner() external
```

Called to select the winner of a lottery and to distribute the prize.

_Cannot be called until the lottery is not closed._

### withdraw

```solidity
function withdraw(uint256 amount) external
```

Called to withdraw the deposited amount of tokens.

_Cannot be called until the lottery is closed._

### setPrizeStrategy

```solidity
function setPrizeStrategy(contract IStrategy _strategy) external
```

Used to set the address of the prizeStrategy contract.

_Can be called only by the owner of the lottery.
Must be called before calling any other functions._

### setPrizePool

```solidity
function setPrizePool(contract IPrizePool _prizePool) external
```

Used to set the address of the prizePool contract.

_Can be called only by the owner of the lottery.
Must be called before calling any other functions._

### getFuturePrize

```solidity
function getFuturePrize() external view returns (uint256)
```

Used to get the prize accumulated since the beginning of the lottery.

_Can be called until the lottery is closed. 
The returning value equals to the interest accrued from participants' deposits to the yieldSource.
The prize is not stable._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Returns the future prize of the lottery |

## IPrizePool

The YieldSourcePrizePool interface.

### depositTo

```solidity
function depositTo(address to, uint256 amount) external
```

Deposits assets into the YieldSource in exchange for tokens.

_Can only be called by the Lottery._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address receiving the shares. |
| amount | uint256 | The amount of assets to deposit. |

### withdrawFrom

```solidity
function withdrawFrom(address from, address to, uint256 amount) external
```

Withdraws assets from the YieldSource.

_Can only be called by the Lottery._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The tokens owner's address. |
| to | address | The address receiving a specific number of deposited tokens. |
| amount | uint256 | The number of tokens to be withdrawn. |

### claimInterest

```solidity
function claimInterest() external
```

Claims interest accrued from deposits to the YieldSource.

_Can only be called by the PrizeStrategy contract._

### balance

```solidity
function balance() external returns (uint256)
```

Returns the total balance.

_Returns the total number of deposited funds + any accrued interest._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The underlying balance of assets. |

### balanceOfUser

```solidity
function balanceOfUser(address user) external view returns (uint256)
```

Returns the number of shares a user received.

_The number of shares equals to the number of deposited tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user, whose balance will be returned. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of deposited assets by a user. |

### getInterest

```solidity
function getInterest() external view returns (uint256)
```

Returns the total interest.

_The total interest equals zero, if nothing was deposited._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of accrued interest. |

### getToken

```solidity
function getToken() external view returns (contract IERC20)
```

Returns the address of the token used for deposits.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20 | Address of the deposit token. |

## IStrategy

The PrizeStrategy interface.

### distribute

```solidity
function distribute(address[] participants) external returns (address winner, uint256 prize)
```

Distributes the prize to the winner of the lottery.

_Selects a random winner from the passed list of participants and transfer the prize to the winner._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| winner | address | The winner of the lottery. |
| prize | uint256 | The prize the winner will receive. |

### setPrizePool

```solidity
function setPrizePool(contract IPrizePool _prizePool) external
```

Sets the address of the YieldSourcePrizePool.

_Can only be called by PrizeStrategy's owner._

### setLottery

```solidity
function setLottery(contract ILottery _lottery) external
```

Set the address of the Lottery.

_Can only be called PrizeStrategy's owner._

### getPrizePool

```solidity
function getPrizePool() external view returns (contract IPrizePool)
```

Returns the address of the PrizePool contract.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IPrizePool | The address of the PrizePool contract. |

### getLottery

```solidity
function getLottery() external view returns (contract ILottery)
```

Returns the address of the Lottery contract.

_New lottery can be created, so the address should be changed._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract ILottery | The address of the Lottery contract. |

### getPrize

```solidity
function getPrize() external view returns (uint256)
```

Returns the potential prize of the lottery.

_Returns  the potenial prize of the lottery which equals to the total accrued interest._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The prize of the lottery. |

## LotteryFactory

The LotteryFactory contract that is responsible for the creation of new lotteries.

_The contract has the functionality to create a new lottery as well as set the address of the implementation contract._

### lotteryImplementation

```solidity
address lotteryImplementation
```

The address of the implementation contract.

_It is stored in the minimal proxy of the newly created lottery._

### allLotteries

```solidity
address[] allLotteries
```

The array storing the addresses of all created lotteries.

_Raises an error if empty and someone tries to access it via the getter function._

### LotteryCreated

```solidity
event LotteryCreated(address owner, address lottery, address tokenAddress, uint256 ticketPrice, uint256 interval, uint256 allLotteriesLength)
```

_Emitted when a new lottery is created._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | Address of the owner of the LotteryFactory contract. |
| lottery | address | Address of the created lottery. |
| tokenAddress | address | Address of the token used for deposits. |
| ticketPrice | uint256 | Price that must be paid to participate in a lottery. |
| interval | uint256 | The time how long a lottery will last |
| allLotteriesLength | uint256 |  |

### constructor

```solidity
constructor(address _lotteryImplementation) public
```

Deploy the LotteryFactory contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lotteryImplementation | address | Address of the implementation that will be used by proxy. |

### createLottery

```solidity
function createLottery(address _tokenAddress, uint256 _ticketPrice, uint256 _interval) external returns (address lottery)
```

Create a lottery.

_The passed params cannot be zero and the function can only be called by the owner of the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenAddress | address | The address of the token that will be used as a ticket. |
| _ticketPrice | uint256 | The amount of tokenAddress to be paid to participate in the lottery. |
| _interval | uint256 | How long the lottery wil last. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| lottery | address | The address of the newly created lottery(proxy). |

### setLotteryImplementation

```solidity
function setLotteryImplementation(address _lotteryImplementation) external
```

Set the lottery implementation.

_Cannot be zero address. The function is only called by the owner of the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lotteryImplementation | address | The address of the lottery implementation |

## ATokenInterface

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() external view returns (address)
```

_Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)_

## IAToken

### Mint

```solidity
event Mint(address from, uint256 value, uint256 index)
```

_Emitted after the mint action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address performing the mint |
| value | uint256 | The amount being |
| index | uint256 | The new liquidity index of the reserve |

### mint

```solidity
function mint(address user, uint256 amount, uint256 index) external returns (bool)
```

_Mints `amount` aTokens to `user`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address receiving the minted tokens |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` if the the previous balance of the user was 0 |

### Burn

```solidity
event Burn(address from, address target, uint256 value, uint256 index)
```

_Emitted after aTokens are burned_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The owner of the aTokens, getting them burned |
| target | address | The address that will receive the underlying |
| value | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### BalanceTransfer

```solidity
event BalanceTransfer(address from, address to, uint256 value, uint256 index)
```

_Emitted during the transfer action_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The user whose tokens are being transferred |
| to | address | The recipient |
| value | uint256 | The amount being transferred |
| index | uint256 | The new liquidity index of the reserve |

### burn

```solidity
function burn(address user, address receiverOfUnderlying, uint256 amount, uint256 index) external
```

_Burns aTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The owner of the aTokens, getting them burned |
| receiverOfUnderlying | address | The address that will receive the underlying |
| amount | uint256 | The amount being burned |
| index | uint256 | The new liquidity index of the reserve |

### mintToTreasury

```solidity
function mintToTreasury(uint256 amount, uint256 index) external
```

_Mints aTokens to the reserve treasury_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The amount of tokens getting minted |
| index | uint256 | The new liquidity index of the reserve |

### transferOnLiquidation

```solidity
function transferOnLiquidation(address from, address to, uint256 value) external
```

_Transfers aTokens in the event of a borrow being liquidated, in case the liquidators reclaims the aToken_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address getting liquidated, current owner of the aTokens |
| to | address | The recipient |
| value | uint256 | The amount of tokens getting transferred |

### transferUnderlyingTo

```solidity
function transferUnderlyingTo(address user, uint256 amount) external returns (uint256)
```

_Transfers the underlying asset to `target`. Used by the LendingPool to transfer
assets in borrow(), withdraw() and flashLoan()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The recipient of the underlying |
| amount | uint256 | The amount getting transferred |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount transferred |

### handleRepayment

```solidity
function handleRepayment(address user, uint256 amount) external
```

_Invoked to execute actions on the aToken side after a repayment._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user executing the repayment |
| amount | uint256 | The amount getting repaid |

### getIncentivesController

```solidity
function getIncentivesController() external view returns (contract IAaveIncentivesController)
```

_Returns the address of the incentives controller contract_

### UNDERLYING_ASSET_ADDRESS

```solidity
function UNDERLYING_ASSET_ADDRESS() external view returns (address)
```

_Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)_

## IAaveIncentivesController

### RewardsAccrued

```solidity
event RewardsAccrued(address user, uint256 amount)
```

_Emitted during `handleAction`, `claimRewards` and `claimRewardsOnBehalf`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user that accrued rewards |
| amount | uint256 | The amount of accrued rewards |

### RewardsClaimed

```solidity
event RewardsClaimed(address user, address to, uint256 amount)
```

### RewardsClaimed

```solidity
event RewardsClaimed(address user, address to, address claimer, uint256 amount)
```

_Emitted during `claimRewards` and `claimRewardsOnBehalf`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address that accrued rewards  @param to The address that will be receiving the rewards |
| to | address |  |
| claimer | address | The address that performed the claim |
| amount | uint256 | The amount of rewards |

### ClaimerSet

```solidity
event ClaimerSet(address user, address claimer)
```

_Emitted during `setClaimer`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |
| claimer | address | The address of the claimer |

### getAssetData

```solidity
function getAssetData(address asset) external view returns (uint256, uint256, uint256)
```

Returns the configuration of the distribution for a certain asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the reference asset of the distribution |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The asset index |
| [1] | uint256 | The emission per second |
| [2] | uint256 | The last updated timestamp |

### assets

```solidity
function assets(address asset) external view returns (uint128, uint128, uint256)
```

LEGACY **************************

_Returns the configuration of the distribution for a certain asset_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the reference asset of the distribution |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint128 | The asset index, the emission per second and the last updated timestamp |
| [1] | uint128 |  |
| [2] | uint256 |  |

### setClaimer

```solidity
function setClaimer(address user, address claimer) external
```

Whitelists an address to claim the rewards on behalf of another address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |
| claimer | address | The address of the claimer |

### getClaimer

```solidity
function getClaimer(address user) external view returns (address)
```

Returns the whitelisted claimer for a certain address (0x0 if not set)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The claimer address |

### configureAssets

```solidity
function configureAssets(address[] assets, uint256[] emissionsPerSecond) external
```

Configure assets for a certain rewards emission

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The assets to incentivize |
| emissionsPerSecond | uint256[] | The emission for each asset |

### handleAction

```solidity
function handleAction(address asset, uint256 userBalance, uint256 totalSupply) external
```

Called by the corresponding asset on any update that affects the rewards distribution

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the user |
| userBalance | uint256 | The balance of the user of the asset in the pool |
| totalSupply | uint256 | The total supply of the asset in the pool |

### getRewardsBalance

```solidity
function getRewardsBalance(address[] assets, address user) external view returns (uint256)
```

Returns the total of rewards of a user, already accrued + not yet accrued

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The assets to accumulate rewards for |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The rewards |

### claimRewards

```solidity
function claimRewards(address[] assets, uint256 amount, address to) external returns (uint256)
```

Claims reward for a user, on the assets of the pool, accumulating the pending rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The assets to accumulate rewards for |
| amount | uint256 | Amount of rewards to claim |
| to | address | Address that will be receiving the rewards |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Rewards claimed |

### claimRewardsOnBehalf

```solidity
function claimRewardsOnBehalf(address[] assets, uint256 amount, address user, address to) external returns (uint256)
```

Claims reward for a user on its behalf, on the assets of the pool, accumulating the pending rewards.

_The caller must be whitelisted via "allowClaimOnBehalf" function by the RewardsAdmin role manager_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| assets | address[] | The assets to accumulate rewards for |
| amount | uint256 | The amount of rewards to claim |
| user | address | The address to check and claim rewards |
| to | address | The address that will be receiving the rewards |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of rewards claimed |

### getUserUnclaimedRewards

```solidity
function getUserUnclaimedRewards(address user) external view returns (uint256)
```

Returns the unclaimed rewards of the user

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The unclaimed user rewards |

### getUserAssetData

```solidity
function getUserAssetData(address user, address asset) external view returns (uint256)
```

Returns the user index for a specific asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |
| asset | address | The asset to incentivize |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The user index for the asset |

### REWARD_TOKEN

```solidity
function REWARD_TOKEN() external view returns (address)
```

for backward compatibility with previous implementation of the Incentives controller

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the reward token |

### PRECISION

```solidity
function PRECISION() external view returns (uint8)
```

for backward compatibility with previous implementation of the Incentives controller

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The precision used in the incentives controller |

### DISTRIBUTION_END

```solidity
function DISTRIBUTION_END() external view returns (uint256)
```

_Gets the distribution end timestamp of the emissions_

## IInitializableAToken

Interface for the initialize function on AToken

### Initialized

```solidity
event Initialized(address underlyingAsset, address pool, address treasury, address incentivesController, uint8 aTokenDecimals, string aTokenName, string aTokenSymbol, bytes params)
```

_Emitted when an aToken is initialized_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| underlyingAsset | address | The address of the underlying asset |
| pool | address | The address of the associated pool |
| treasury | address | The address of the treasury |
| incentivesController | address | The address of the incentives controller for this aToken |
| aTokenDecimals | uint8 | The decimals of the underlying |
| aTokenName | string | The name of the aToken |
| aTokenSymbol | string | The symbol of the aToken |
| params | bytes | A set of encoded parameters for additional initialization |

### initialize

```solidity
function initialize(contract IPool pool, address treasury, address underlyingAsset, contract IAaveIncentivesController incentivesController, uint8 aTokenDecimals, string aTokenName, string aTokenSymbol, bytes params) external
```

Initializes the aToken

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | contract IPool | The pool contract that is initializing this contract |
| treasury | address | The address of the Aave treasury, receiving the fees on this aToken |
| underlyingAsset | address | The address of the underlying asset of this aToken (E.g. WETH for aWETH) |
| incentivesController | contract IAaveIncentivesController | The smart contract managing potential incentives distribution |
| aTokenDecimals | uint8 | The decimals of the aToken, same as the underlying asset's |
| aTokenName | string | The name of the aToken |
| aTokenSymbol | string | The symbol of the aToken |
| params | bytes | A set of encoded parameters for additional initialization |

## IPoolDataProvider

### getReserveData

```solidity
function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)
```

Returns the reserve data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| unbacked | uint256 | The amount of unbacked tokens |
| accruedToTreasuryScaled | uint256 | The scaled amount of tokens accrued to treasury that is to be minted |
| totalAToken | uint256 | The total supply of the aToken |
| totalStableDebt | uint256 | The total stable debt of the reserve |
| totalVariableDebt | uint256 | The total variable debt of the reserve |
| liquidityRate | uint256 | The liquidity rate of the reserve |
| variableBorrowRate | uint256 | The variable borrow rate of the reserve |
| stableBorrowRate | uint256 | The stable borrow rate of the reserve |
| averageStableBorrowRate | uint256 | The average stable borrow rate of the reserve |
| liquidityIndex | uint256 | The liquidity index of the reserve |
| variableBorrowIndex | uint256 | The variable borrow index of the reserve |
| lastUpdateTimestamp | uint40 | The timestamp of the last update of the reserve |

### getATokenTotalSupply

```solidity
function getATokenTotalSupply(address asset) external view returns (uint256)
```

Returns the total supply of aTokens for a given asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total supply of the aToken |

### getTotalDebt

```solidity
function getTotalDebt(address asset) external view returns (uint256)
```

Returns the total debt for a given asset

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| asset | address | The address of the underlying asset of the reserve |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total debt for asset |

## IScaledBalanceToken

### scaledBalanceOf

```solidity
function scaledBalanceOf(address user) external view returns (uint256)
```

_Returns the scaled balance of the user. The scaled balance is the sum of all the
updated stored balance divided by the reserve's liquidity index at the moment of the update_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user whose balance is calculated |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |

### getScaledUserBalanceAndSupply

```solidity
function getScaledUserBalanceAndSupply(address user) external view returns (uint256, uint256)
```

_Returns the scaled balance of the user and the scaled total supply._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled balance of the user |
| [1] | uint256 | The scaled balance and the scaled total supply |

### scaledTotalSupply

```solidity
function scaledTotalSupply() external view returns (uint256)
```

_Returns the scaled total supply of the variable debt token. Represents sum(debt/index)_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The scaled total supply |

## IYieldSource

The ATokenYieldSource interface.

### supplyTokenTo

```solidity
function supplyTokenTo(address from, address to, uint256 mintAmount) external
```

Supplies tokens to the yield source.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address of the entity depositing tokens to the pool. |
| to | address | Address of the user receiving the shares of the pool. |
| mintAmount | uint256 | Amount of deposited tokens. |

### redeemToken

```solidity
function redeemToken(address from, address to, uint256 amount) external
```

Redeems tokens from the yield source.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address of the entity withdrawing shares from. |
| to | address | Address of the entity that will receive the deposited tokens. |
| amount | uint256 | Amount of tokens to be redeemed. |

### withdrawInterest

```solidity
function withdrawInterest(address to) external returns (bool)
```

Withdraws accrued interest from the yieldSource.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Address of an account that will receive the interest. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if operation was successful. |

### depositToken

```solidity
function depositToken() external view returns (address)
```

Returns the ERC20 asset token used for deposits.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The ERC20 asset token address. |

### totalBalance

```solidity
function totalBalance() external view returns (uint256)
```

Returns the total number of deposited funds along with accrued interest.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The uin256 value of totalBalance. |

### getTotalInterest

```solidity
function getTotalInterest() external view returns (uint256)
```

Returns the total accrued interest.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The uin256 value of total accrued interest. |

## ClonesMock

The ClonesMock contract used to test out the functionality of minimal proxies.

### predictAddress

```solidity
function predictAddress(address implementation, bytes32 salt, address deployer) external pure returns (address factoryAddress)
```

The predictAddress function is used to predict the Deterministic Address of a lottery.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of the Lottery implementation. |
| salt | bytes32 | Bytes32 value used as salt for prediction. |
| deployer | address | Address of the lottery deployer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| factoryAddress | address | Address of the predicted lottery. |

## YieldSourcePrizePool

The YieldSourcePrizePool contract to interact with the yieldSource.

### yieldSource

```solidity
contract IYieldSource yieldSource
```

Address of the yield source.

### prizeStrategy

```solidity
contract IStrategy prizeStrategy
```

Address of the prizeStrategy.

### lottery

```solidity
contract ILottery lottery
```

Address of the lottery contract.

### Deployed

```solidity
event Deployed(address yieldSource, address prizeStrategy, address lottery)
```

_Emitted when the contract is deployed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| yieldSource | address | Address of the yield source. |
| prizeStrategy | address | Address of the PrizeStrategy contract. |
| lottery | address | Address of the Lottery contract. |

### constructor

```solidity
constructor(contract IYieldSource _yieldSource, contract IStrategy _prizeStrategy, contract ILottery _lottery) public
```

Deploy the YieldSourcePrizePool contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _yieldSource | contract IYieldSource | Address of the yieldSource. |
| _prizeStrategy | contract IStrategy | Address of the prizeStrategy. |
| _lottery | contract ILottery | Address of the lottery. |

### onlyLottery

```solidity
modifier onlyLottery()
```

_Throws if called by any account other than the lottery._

### onlyStrategy

```solidity
modifier onlyStrategy()
```

_Throws if called by any account other than the prizeStrategy._

### depositTo

```solidity
function depositTo(address to, uint256 amount) external
```

Deposit assets into the YieldSource in exchange for tokens.

_Can only be called by the Lottery._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address receiving the shares. |
| amount | uint256 | The amount of assets to deposit. |

### withdrawFrom

```solidity
function withdrawFrom(address from, address to, uint256 amount) external
```

Withdraw assets from the YieldSource.

_Can only be called by the Lottery._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The tokens owner's address. |
| to | address | The address receiving a specific number of deposited tokens. |
| amount | uint256 | The number of tokens to be withdrawn. |

### claimInterest

```solidity
function claimInterest() external
```

Claim interest accrued from deposits to the YieldSource.

_Can only be called by the PrizeStrategy contract._

### setLottery

```solidity
function setLottery(contract ILottery _lottery) external
```

Set the address of the Lottery.

_Can only be called PrizeStrategy's owner._

### balance

```solidity
function balance() external view returns (uint256)
```

Return the total balance.

_Return the total number of deposited funds + any accrued interest._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The underlying balance of assets. |

### balanceOfUser

```solidity
function balanceOfUser(address user) external view returns (uint256)
```

Return the number of shares a user received.

_The number of shares equals to the number of deposited tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user, whose balance will be returned. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of deposited assets by a user. |

### getInterest

```solidity
function getInterest() external view returns (uint256)
```

Return the total interest.

_The total interest equals zero, if nothing was deposited._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The total number of accrued interest. |

### getToken

```solidity
function getToken() external view returns (contract IERC20)
```

Return the address of the token used for deposits.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20 | Address of the deposit token. |

### _requireTokensGTZero

```solidity
function _requireTokensGTZero(uint256 _tokens) internal pure
```

Check whether the passed number of tokens is greater than zero.

## PrizeStrategy

### prizePool

```solidity
contract IPrizePool prizePool
```

PrizePool address.

### lottery

```solidity
contract ILottery lottery
```

Lottery address.

### onlyLottery

```solidity
modifier onlyLottery()
```

_Throws if called by any account other than the Lottery._

### distribute

```solidity
function distribute(address[] participants) external returns (address winner, uint256 prize)
```

Distributes the prize to the winner of the lottery.

_Selects a random winner from the passed list of participants and transfer the prize to the winner. Can only be called by the Lottery._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| winner | address | The winner of the lottery. |
| prize | uint256 | The prize the winner will receive. |

### setPrizePool

```solidity
function setPrizePool(contract IPrizePool _prizePool) external
```

Set the address of the YieldSourcePrizePool.

_Can only be called by PrizeStrategy's owner._

### setLottery

```solidity
function setLottery(contract ILottery _lottery) external
```

Set the address of the Lottery.

_Can only be called PrizeStrategy's owner._

### getPrizePool

```solidity
function getPrizePool() external view returns (contract IPrizePool)
```

Returns the address of the PrizePool contract.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IPrizePool | The address of the PrizePool contract. |

### getLottery

```solidity
function getLottery() external view returns (contract ILottery)
```

Returns the address of the Lottery contract.

_New lottery can be created, so the address should be changed._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract ILottery | The address of the Lottery contract. |

### getPrize

```solidity
function getPrize() external view returns (uint256)
```

Returns the potential prize of the lottery.

_Returns  the potenial prize of the lottery which equals to the total accrued interest._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The prize of the lottery. |

## ATokenYieldSource

### aToken

```solidity
contract ATokenInterface aToken
```

Address of the aToken.

### poolAddressesProvider

```solidity
contract IPoolAddressesProvider poolAddressesProvider
```

Address of the poolAddressesProvider.

### ATokenYieldSourceInitialized

```solidity
event ATokenYieldSourceInitialized(contract IAToken aToken, contract IPoolAddressesProvider poolAddressesProvider, uint8 decimals, string name, string symbol, address owner)
```

_Emitted when the ATokenYieldSource is created._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| aToken | contract IAToken | Address of the IAToken contract. |
| poolAddressesProvider | contract IPoolAddressesProvider | Address of the poolAddressesProvider. |
| decimals | uint8 | Decimals of the token used for shares. |
| name | string | Name of the token used for shares. |
| symbol | string | Symbol of the token used for shares. |
| owner | address | Owner of the ATokenYieldSource. |

### Claimed

```solidity
event Claimed(address claimer, uint256 amount)
```

Emitted when Aave compound have been claimed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| claimer | address | Address of the account receving the accrued interest. |
| amount | uint256 | The interest the claimer will receive. |

### SuppliedTokenTo

```solidity
event SuppliedTokenTo(address from, address sharesTo, address aTokensTo, uint256 amountSharesMinted, uint256 aTokensAmountMinted)
```

Emitted when asset tokens are supplied to the yield source.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address of the account deposited assets. |
| sharesTo | address | Address of the account that will receive the shares. |
| aTokensTo | address | Address of the account that received the deposited assets. |
| amountSharesMinted | uint256 | Number of shares to address will receive. |
| aTokensAmountMinted | uint256 | Number of aTokens to address will receive. |

### RedeemedToken

```solidity
event RedeemedToken(address sharesFrom, address daiTo, uint256 sharesBurned, uint256 daiAmountRedeemed)
```

Emitted when asset tokens are redeemed from the yield source.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sharesFrom | address | Address from what the shares tokens will be substracted. |
| daiTo | address | Address to which the redeemed DAI will be transfered. |
| sharesBurned | uint256 | Amount of shares tokens that will be burnt. |
| daiAmountRedeemed | uint256 | Amount of DAI that will be redeemed. |

### constructor

```solidity
constructor(contract ATokenInterface _aToken, contract IPoolAddressesProvider _poolAddressesProvider, uint8 _decimals, string _symbol, string _name) public
```

Deploy the ATokenYieldSource contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _aToken | contract ATokenInterface | Address of the aToken |
| _poolAddressesProvider | contract IPoolAddressesProvider | Address of the poolAddressesProvider. |
| _decimals | uint8 | Decimals of the token used for shares. |
| _symbol | string | Symbol of the token used for shares. |
| _name | string | Name of the token used for shares. |

### decimals

```solidity
function decimals() public view returns (uint8)
```

Returns the number of decimals that the token repesenting yield source shares has.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The number of decimals used by shares token. |

### depositToken

```solidity
function depositToken() public view returns (address)
```

Returns the ERC20 asset token used for deposits.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The ERC20 asset token address. |

### totalBalance

```solidity
function totalBalance() external view returns (uint256)
```

The total aBalance including deposited tokens and accrued interest.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Total number of aToken. |

### supplyTokenTo

```solidity
function supplyTokenTo(address from, address to, uint256 mintAmount) external
```

Supplies asset tokens to the yield source

_Shares corresponding to the number of tokens supplied are mint to the user's balance
Asset tokens are supplied to the yield source, then deposited into Aave_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address |  |
| to | address | The user whose balance will receive the tokens |
| mintAmount | uint256 | The amount of asset tokens to be supplied |

### redeemToken

```solidity
function redeemToken(address from, address to, uint256 redeemAmount) external
```

Redeems asset tokens from the yield source

_Shares corresponding to the number of tokens withdrawn are burnt from the user's balance
Asset tokens are withdrawn from Aave, then transferred from the yield source to the user's wallet_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address |  |
| to | address |  |
| redeemAmount | uint256 | The amount of asset tokens to be redeemed |

### withdrawInterest

```solidity
function withdrawInterest(address to) external returns (bool)
```

Claims the accrued rewards for the aToken, accumulating any pending rewards.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Address where the claimed rewards will be sent. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if operation was successful. |

### getTotalInterest

```solidity
function getTotalInterest() external view returns (uint256)
```

Returns the total accrued interest.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The uin256 value of total accrued interest. |

### _lendingPool

```solidity
function _lendingPool() internal view returns (contract IPool)
```

Retrieves Aave LendingPool address

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IPool | A reference to LendingPool interface |

### _requireTokensGTZero

```solidity
function _requireTokensGTZero(uint256 _tokens) internal pure
```

Function is used to ensure that the passed number of tokens are greater than zero.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokens | uint256 | The passed number of tokens to be checked. |

### _depositToAave

```solidity
function _depositToAave(address from, uint256 mintAmount) internal
```

Deposits asset tokens to Aave.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Address of the depositor. |
| mintAmount | uint256 | The amount of asset tokens to be deposited. |

