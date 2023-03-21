// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPrizePool.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/ILottery.sol";


/** @title  Lottery
  * @author vvlnko
  * @notice The Lottery contract with the functionality for participation, winner selection, withdrawal in case of not being selected as the winner as well as getting the potential prize.
*/
contract Lottery is ILottery {
    /// @dev A safe way to use IERC20 interface.
    using SafeERC20 for IERC20;
    /// @dev A mapping that stores the participants of the lottery.
    /// @return The bool value which indicates whether a user participated in the lottery or not.
    mapping(address => bool) public isParticipated;

    /// @dev An array that stores addresses of lottery participants.
    address[] public participants;
    
    /// @notice The owner of the lottery
    /// @dev It is set via the minimal proxy.
    address public owner;

    /// @notice The address of the LotteryFactory.
    /// @dev LotteryFactory is responsible for the creation of new lotteries.
    address public lotteryFactory;

    /// @notice The address of the token that is deposited to the lottery.
    /// @dev It is deposited to the YieldSource in exchange of ATokens.
    IERC20 public token;
    
    /// @notice The address of the prizePool.
    /// @dev The PrizePool is used by the lottery to deposit/withdraw tokens.
    IPrizePool public prizePool;
    
    /// @notice The address of the PrizeStrategy.
    /// @dev The PrizeStrategy is used by the Lottery to distribute the prize.
    IStrategy public  strategy;

    /// @notice The interval which indicates how long a lottery lasts.
    /// @dev A lottery is closed when the time plus interval is over.
    uint public interval;

    /// @notice The price of a ticket.
    /// @dev It must be paid to participate in a lottery.
    uint public ticketPrice;
    
    /// @notice The deadline of a lottery.
    /// @dev It is initialized automatically when a first participant calls the pariticipate function. 
    uint public deadline;

    /// @notice The winner of a lottery.
    /// @dev It is chosen by the PrizeStrategy.
    address public winner;
    
    /// @notice The prize of a lottery.
    /// @dev Equals to the total accrued interest.
    uint public prize;

    /// @notice Emitted when a new participant deposits funds to a lottery.
    /// @param player The address of a participant.
    /// @param amount The amount of deposited funds.
    event Deposited(address player, uint amount);

    /// @notice The initialize function is used to initialize the Lottery with the necessary data.
    /// @dev The function is called only once by the LotteryFactory via the MinimalProxy
    /// @param _owner The owner of the lottery
    /// @param _tokenAddress The address of the token that will be used as the ticket in a lottery
    /// @param _ticketPrice  The price a user has to pay to participate in a lottery
    /// @param _interval This is how long a lottery will be open
    function initialize(address _owner, address _tokenAddress, uint256 _ticketPrice, uint _interval) external {
        require(lotteryFactory == address(0), "Lottery: already-initialized");
        owner = _owner;
        token = IERC20(_tokenAddress);
        lotteryFactory = msg.sender;
        ticketPrice = _ticketPrice;
        interval = _interval;
    }


    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner {
        require(msg.sender == owner, "Lottery: not-owner");
        _;
    }

    /// @notice Sets the address of the PrizePool contract.
    /// @dev Can only be called by the owner of the contract and the address must be set before using any other functions.
    /// @param _prizePool The address of the PrizePool contract.
    function setPrizePool(IPrizePool _prizePool) external onlyOwner {
        require(address(_prizePool) != address(0), "Lottery: prizePool-address-not-zero");
        prizePool = _prizePool;
    }

    /// @notice Sets the address of the PrizeStrategy contract.
    /// @dev Can only be called by the owner and the address must be set before using any other functions.
    /// @param _strategy The address of the PrizeStrategy contract.
    function setPrizeStrategy(IStrategy _strategy) external onlyOwner {
        require(address(_strategy) != address(0), "Lottery: strategy-address-not-zero");
        strategy = _strategy;
    }

    /// @notice The function is used to participate in the lottery.
    /// @dev Cannot be called when the lottery is closed or the address of the PrizePool contract is not set.
    function participate() external {        
        require (deadline == 0 || block.timestamp < deadline, "Lottery: closed-for-participation");
        require(!isParticipated[msg.sender], "Lottery: already-participated");
        require(address(prizePool) != address(0), "Lottery: prizePool-address-not-zero");
       
        uint256 allowedAmount = token.allowance(msg.sender, address(this));

        // First deposit
        if(deadline == 0) {
            deadline = block.timestamp + interval;
        }

        isParticipated[msg.sender] = true;
        participants.push(msg.sender);

        token.safeTransferFrom(msg.sender, address(prizePool), allowedAmount);
        prizePool.depositTo(msg.sender, allowedAmount);
        emit Deposited(msg.sender, allowedAmount);
    }

    /// @notice The function is called to pick the winner of the lottery.
    /// @dev The function fails if the lottery is not started or not closed yet.
    function pickWinner() external {
        require(deadline != 0, "Lottery: not-started-yet");
        require(deadline <= block.timestamp, "Lottery: not-finished-yet");
        (winner, prize) = strategy.distribute(participants);     
    }

    /// @notice Withdraws the deposited assets.
    /// @dev The function fails if the lottery is not started or not closed yet.
    /// @param amount The number of tokens to be withdrawn.
    function withdraw(uint256 amount) external {
        require(deadline != 0, "Lottery: not-started-yet");
        require(deadline  <= block.timestamp, "Lottery: not-finished-yet");
        prizePool.withdrawFrom(msg.sender, msg.sender, amount);
    }
    
    /// @notice Returns the potential prize the lottery winner will have.
    /// @dev The function fails if the lottery is not started or closed. The potenital prize is not stable. It accumulates.
    /// @return The uint256 prize value.
    function getFuturePrize() external view returns (uint256) {
        require(deadline != 0, "Lottery: not-started-yet");
        require(block.timestamp < deadline, "Lottery: closed-for-participation");
        return strategy.getPrize();
    }
}