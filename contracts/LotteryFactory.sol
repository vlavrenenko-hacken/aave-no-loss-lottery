// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILottery.sol";

/** @title  LotteryFactory
  * @author vvlnko
  * @notice The LotteryFactory contract that is responsible for the creation of new lotteries.
  * @dev The contract has the functionality to create a new lottery as well as set the address of the implementation contract.
*/
contract LotteryFactory is Ownable {

    /// @notice The address of the implementation contract.
    /// @dev It is stored in the minimal proxy of the newly created lottery.
    address public lotteryImplementation;

    /// @notice The array storing the addresses of all created lotteries.
    /// @dev Raises an error if empty and someone tries to access it via the getter function.
    address[] public allLotteries;

    /// @dev Emitted when a new lottery is created.
    event LotteryCreated(
        address indexed owner,
        address indexed lottery,
        address indexed tokenAddress,
        uint ticketPrice,
        uint interval,
        uint allLotteriesLength
    );

    /// @notice Deploy the LotteryFactory contract.
    /// @param _lotteryImplementation Address of the implementation that will be used by proxy.
    constructor(address _lotteryImplementation) {
        lotteryImplementation = _lotteryImplementation;
    }

    /// @notice Create a lottery.
    /// @param _tokenAddress The address of the token that will be used as a ticket.
    /// @param _ticketPrice The amount of tokenAddress to be paid to participate in the lottery.
    /// @param _interval How long the lottery wil last.
    /// @dev The passed params cannot be zero and the function can only be called by the owner of the contract.
    /// @return lottery The address of the newly created lottery(proxy).
    function createLottery(address _tokenAddress, uint _ticketPrice, uint256 _interval) external onlyOwner returns (address lottery) {
        require(_tokenAddress != address(0), "LotteryFactory/tokenAddress-not-zero-address");
        require(_ticketPrice != 0, "LotteryFactory/ticketPrice-not-zero-value");
        require(_interval != 0, "Lottery/interval-not-zero");
        
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        lottery = Clones.cloneDeterministic(lotteryImplementation, salt);
        ILottery(lottery).initialize(msg.sender, _tokenAddress, _ticketPrice, _interval);
        allLotteries.push(lottery);
        emit LotteryCreated(msg.sender, lottery, _tokenAddress, _ticketPrice, _interval, allLotteries.length);
    }

    /// @notice Set the lottery implementation.
    /// @dev Cannot be zero address. The function is only called by the owner of the contract.
    /// @param _lotteryImplementation The address of the lottery implementation
    function setLotteryImplementation(address _lotteryImplementation) external onlyOwner {
        require(_lotteryImplementation != address(0), "LotteryFactory/implementation-not-zero-address");
        lotteryImplementation = _lotteryImplementation;
    }
}