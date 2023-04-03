
# Project Overfiew

The sample project is a no-loss lottery.
It lets users participate in a lottery for the tokens deposited in advance as tickets. In the case of loss, users will not lose any assets. In a case of victory, the winner receives all the accrued interest from other deposits.

The project can be used as follows:
- To install the dependencies
npm install
npm install hardhat-shorthand

- To compile the contracts
hh compile

- User has to create the .env file providing the missing WEB3_ALCHEMY_POLYGON_ID key before running the tests. To run the tests use
 hh test --network hardhat
- To run the coverage
 hh coverage
