
# Project Overfiew

The sample project is a no-loss lottery.
It lets users to participate in a lottery for the tokens deposited in advance as tickets. In a case of the loss, users will not lose any money. In a case of victory, the winner receives all the incrued interest from other deposits. 

The project can be used as follows:
- To install the dependencies
npm install
npm install hardhat-shorthand

- To compile the contracts
hh compile

- To run the tests a user has to create the .env file providing the missing WEB3_ALCHEMY_POLYGON_ID key. To run the tests use
 hh test --network hardhat
- To run the coverage
 hh coverage
