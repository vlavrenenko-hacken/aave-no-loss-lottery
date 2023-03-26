// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/proxy/Clones.sol";

/** @title  ClonesMock
  * @author vvlnko
  * @notice The ClonesMock contract used to test out the functionality of minimal proxies.
*/
contract ClonesMock {
    /// @notice The predictAddress function is used to predict the Deterministic Address of a lottery.
    /// @param implementation The address of the Lottery implementation.
    /// @param salt Bytes32 value used as salt for prediction.
    /// @param deployer Address of the lottery deployer.
    /// @return factoryAddress Address of the predicted lottery.
    function predictAddress(address implementation, bytes32 salt, address deployer) external pure returns (address factoryAddress) {
        factoryAddress = Clones.predictDeterministicAddress(implementation, salt, deployer);
    }
}