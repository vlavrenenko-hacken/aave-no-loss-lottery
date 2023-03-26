import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {DAI_ADDR, aDAI_ADDR, DAI_WHALE, AAVE_POOL_ADDRESS_PROVIDER} from "./config.js";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";

describe("Lottery Test", function () {
    const TICKET_PRICE = ethers.utils.parseEther("100"); // 100 tokens
    const INTERVAL = ethers.BigNumber.from("1209600"); // 2 weeks

    async function deployFixture() {
        const [owner, otherAccount] = await ethers.getSigners();
    
        const ATokenYieldSource = await ethers.getContractFactory("ATokenYieldSource");
        const aTokenYieldSource = await ATokenYieldSource.deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI");
        await aTokenYieldSource.deployed();
    
        const PrizeStrategy = await ethers.getContractFactory("PrizeStrategy");
        const prizeStrategy = await PrizeStrategy.deploy();
        await prizeStrategy.deployed();
        
        const LotteryImpl = await ethers.getContractFactory("Lottery");
        const lotteryImpl = await LotteryImpl.deploy();
        await lotteryImpl.deployed();

        const LotteryFactory = await ethers.getContractFactory("LotteryFactory");
        const lotteryFactory = await LotteryFactory.deploy(lotteryImpl.address);
        await lotteryFactory.deployed();

        await lotteryFactory.createLottery(DAI_ADDR, TICKET_PRICE, INTERVAL);
        const lotteryAddress = await lotteryFactory.allLotteries(ethers.constants.Zero); 

        const lotteryProxy = LotteryImpl.attach(lotteryAddress);

        // Revert: Lottery: already-initialized
        await expect(lotteryProxy.initialize(owner.address, DAI_ADDR, TICKET_PRICE, INTERVAL)).to.be.revertedWith("Lottery: already-initialized");

        const YieldSourcePrizePool = await ethers.getContractFactory("YieldSourcePrizePool");
        const yieldSourcePrizePool = await YieldSourcePrizePool.deploy(aTokenYieldSource.address, prizeStrategy.address, lotteryProxy.address);
        await yieldSourcePrizePool.deployed();
    

        const dai = await ethers.getContractAt(IERC20.abi, DAI_ADDR);
    
        await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [DAI_WHALE],
        });
        const dai_whale = await ethers.getSigner(DAI_WHALE);

        // Revert: Lottery: prizePool-address-not-zero
        await dai.connect(dai_whale).transfer(otherAccount.address, TICKET_PRICE);

        await expect(lotteryProxy.connect(otherAccount).participate()).to.be.revertedWith("Lottery: prizePool-address-not-zero");


        await prizeStrategy.setPrizePool(yieldSourcePrizePool.address);
        await lotteryProxy.setPrizePool(yieldSourcePrizePool.address);
        await lotteryProxy.setPrizeStrategy(prizeStrategy.address);

        // Revert: Lottery: not-owner
        await expect(lotteryProxy.connect(otherAccount).setPrizePool(yieldSourcePrizePool.address)).to.be.revertedWith("Lottery: not-owner");
  
        // Revert: Lottery: not-owner
        await expect(lotteryProxy.connect(otherAccount).setPrizeStrategy(prizeStrategy.address)).to.be.revertedWith("Lottery: not-owner");

        // Revert: Lottery: prizePool-address-not-zero
        await expect(lotteryProxy.setPrizePool(ethers.constants.AddressZero)).to.be.revertedWith("Lottery: prizePool-address-not-zero");

        // Revert: Lottery: strategy-address-not-zero
        await expect(lotteryProxy.setPrizeStrategy(ethers.constants.AddressZero)).to.be.revertedWith("Lottery: strategy-address-not-zero");

        await aTokenYieldSource.transferOwnership(yieldSourcePrizePool.address);
        await prizeStrategy.transferOwnership(lotteryProxy.address);
        
        return {owner, aTokenYieldSource, yieldSourcePrizePool, prizeStrategy, lotteryProxy, lotteryFactory, dai_whale, dai};
      }

    it("Deployment", async function() {
      const {owner, yieldSourcePrizePool, prizeStrategy, lotteryProxy, lotteryFactory} = await loadFixture(deployFixture);
      expect(await lotteryProxy.lotteryFactory()).to.eq(lotteryFactory.address);
      expect(await lotteryProxy.owner()).to.eq(owner.address);
      expect(await lotteryProxy.token()).to.eq(DAI_ADDR);
      expect(await lotteryProxy.prizePool()).to.eq(yieldSourcePrizePool.address);
      expect(await lotteryProxy.strategy()).to.eq(prizeStrategy.address);
      expect(await lotteryProxy.interval()).to.eq(INTERVAL);
      expect(await lotteryProxy.ticketPrice()).to.eq(TICKET_PRICE);
      expect(await lotteryProxy.deadline()).to.eq(ethers.constants.Zero);
      expect(await lotteryProxy.winner()).to.eq(ethers.constants.AddressZero);
      expect(await lotteryProxy.prize()).to.eq(ethers.constants.Zero);
    })

    it("Should withdraw", async function() {
      const {lotteryProxy, dai_whale, dai} = await loadFixture(deployFixture);
      
      // Lottery: not-started-yet
      await expect(lotteryProxy.withdraw(ethers.utils.parseEther("1"))).to.be.revertedWith("Lottery: not-started-yet");

      // Lottery: not-owner
      await expect(lotteryProxy.connect(dai_whale).withdraw(ethers.utils.parseEther("1"))).to.be.revertedWith("Lottery: not-started-yet");

      const [,,,, player1, player2, player3, player4, player5] = await ethers.getSigners();

      await dai.connect(dai_whale).transfer(player1.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player2.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player3.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player4.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player5.address, TICKET_PRICE);

      
      const players = [player1.address, player2.address, player3.address, player4.address, player5.address];
      
      await dai.connect(player1).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player2).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player3).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player4).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player5).approve(lotteryProxy.address, TICKET_PRICE);

      await lotteryProxy.connect(player1).participate();
      await lotteryProxy.connect(player2).participate();
      await lotteryProxy.connect(player3).participate();
      await lotteryProxy.connect(player4).participate();

      // Revert: Lottery: not-finished-yet
      await expect(lotteryProxy.connect(player1).withdraw(TICKET_PRICE)).to.be.revertedWith("Lottery: not-finished-yet");
      await time.increase(15*24*3600);
      await lotteryProxy.connect(player1).withdraw(TICKET_PRICE);
      
    })

    it("Should pick the winner", async function() {
      const {lotteryProxy, dai_whale, dai} = await loadFixture(deployFixture);
      
      // Revert: Lottery: not-started-yet
      await expect(lotteryProxy.pickWinner()).to.be.revertedWith("Lottery: not-started-yet");

      // Revert: Lottery: not-started-yet
      await expect(lotteryProxy.getFuturePrize()).to.be.revertedWith("Lottery: not-started-yet");

      const [,,,, player1, player2, player3, player4, player5] = await ethers.getSigners();

      await dai.connect(dai_whale).transfer(player1.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player2.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player3.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player4.address, TICKET_PRICE);
      await dai.connect(dai_whale).transfer(player5.address, TICKET_PRICE);

      
      const players = [player1.address, player2.address, player3.address, player4.address, player5.address];
      
      await dai.connect(player1).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player2).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player3).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player4).approve(lotteryProxy.address, TICKET_PRICE);
      await dai.connect(player5).approve(lotteryProxy.address, TICKET_PRICE);

      await lotteryProxy.connect(player1).participate();
      await lotteryProxy.connect(player2).participate();
      await lotteryProxy.connect(player3).participate();
      await lotteryProxy.connect(player4).participate();
      // Revert: Lottery: already-participated
      await expect(lotteryProxy.connect(player4).participate()).to.be.revertedWith("Lottery: already-participated");

      expect(await lotteryProxy.getFuturePrize()).to.greaterThan(ethers.constants.Zero);

      // Revert: Lottery: not-finished-yet
      await expect(lotteryProxy.pickWinner()).to.be.revertedWith("Lottery: not-finished-yet");
      await time.increase(15*24*3600);
      await lotteryProxy.pickWinner();
      expect(players).to.contain(await lotteryProxy.winner());
      const winner = await lotteryProxy.winner();
      expect(await dai.balanceOf(winner)).to.greaterThan(ethers.constants.Zero);

      // Revert: Lottery: closed-for-participation
      await expect(lotteryProxy.getFuturePrize()).to.be.revertedWith("Lottery: closed-for-participation");
      await expect(lotteryProxy.participate()).to.be.revertedWith("Lottery: closed-for-participation");
    })
});