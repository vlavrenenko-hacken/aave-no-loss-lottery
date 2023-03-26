import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {DAI_ADDR, aDAI_ADDR, DAI_WHALE, AAVE_POOL_ADDRESS_PROVIDER } from "./config.js";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";

describe("PrizeStrategy Test", function () {
  const SUPPLY_TOKENS = ethers.utils.parseEther("100000");
  async function deployFixture() {
    const [owner, lottery] = await ethers.getSigners();

    const ATokenYieldSource = await ethers.getContractFactory("ATokenYieldSource");
    const aTokenYieldSource = await ATokenYieldSource.deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI");
    await aTokenYieldSource.deployed();

    const PrizeStrategy = await ethers.getContractFactory("PrizeStrategy");
    const prizeStrategy = await PrizeStrategy.deploy();
    await prizeStrategy.deployed();

    const YieldSourcePrizePool = await ethers.getContractFactory("YieldSourcePrizePool");
    const yieldSourcePrizePool = await YieldSourcePrizePool.deploy(aTokenYieldSource.address, prizeStrategy.address, lottery.address);
    await yieldSourcePrizePool.deployed();

    await aTokenYieldSource.transferOwnership(yieldSourcePrizePool.address);
    await prizeStrategy.setLottery(lottery.address);
    const dai = await ethers.getContractAt(IERC20.abi, DAI_ADDR);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DAI_WHALE],
    });
    const dai_whale = await ethers.getSigner(DAI_WHALE)
    return {owner, aTokenYieldSource, yieldSourcePrizePool, prizeStrategy, lottery, dai_whale, dai};
  }

  it("Deployment", async function() {
    const {yieldSourcePrizePool, prizeStrategy} = await loadFixture(deployFixture);
    await prizeStrategy.setPrizePool(yieldSourcePrizePool.address);
    expect(await prizeStrategy.getPrizePool()).to.eq(yieldSourcePrizePool.address);
  });

  it("Should select the winner and distribute the prize", async function () {
    const {aTokenYieldSource, yieldSourcePrizePool, prizeStrategy, lottery, dai_whale, dai, owner} = await loadFixture(deployFixture);
    const [,,,, player1, player2, player3, player4] = await ethers.getSigners();

    const ticketPrice = ethers.utils.parseEther("100"); // 100 DAI
    await dai.connect(dai_whale).transfer(player1.address, ticketPrice);
    await dai.connect(dai_whale).transfer(player2.address, ticketPrice);
    await dai.connect(dai_whale).transfer(player3.address, ticketPrice);
    await dai.connect(dai_whale).transfer(player4.address, ticketPrice);
    
    const players = [player1.address, player2.address, player3.address, player4.address];
    

    await dai.connect(player1).transfer(yieldSourcePrizePool.address, ticketPrice);
    await yieldSourcePrizePool.connect(lottery).depositTo(player1.address, ticketPrice);
    
    await dai.connect(player2).transfer(yieldSourcePrizePool.address, ticketPrice);
    await yieldSourcePrizePool.connect(lottery).depositTo(player2.address, ticketPrice);

    await dai.connect(player3).transfer(yieldSourcePrizePool.address, ticketPrice);
    await yieldSourcePrizePool.connect(lottery).depositTo(player3.address, ticketPrice);

    await dai.connect(player4).transfer(yieldSourcePrizePool.address, ticketPrice);
    await yieldSourcePrizePool.connect(lottery).depositTo(player4.address, ticketPrice);

    expect(await aTokenYieldSource.totalSupply()).to.eq(ticketPrice.mul(4));

    await time.increase(14*24*3600); // rewind the time 2 weeks ahead


    // Revert: PrizeStrategy/prizePool-address-not-zero
    await expect(prizeStrategy.connect(lottery).distribute(players)).to.be.revertedWith("PrizeStrategy/prizePool-address-not-zero");
    
    // Revert: PrizeStrategy/not-lottery
    await expect(prizeStrategy.connect(owner).distribute(players)).to.be.revertedWith("PrizeStrategy/not-lottery");

    await prizeStrategy.setPrizePool(yieldSourcePrizePool.address);
    const [winner, prize] = await prizeStrategy.connect(lottery).callStatic.distribute(players);
    expect(players).to.contain(winner);    
    expect(prize).to.greaterThan(ethers.constants.Zero);

  })

  it("Should get the prize in 2 weeks", async function() {
    const {yieldSourcePrizePool, prizeStrategy, lottery, dai_whale, dai} = await loadFixture(deployFixture);

    await prizeStrategy.setPrizePool(yieldSourcePrizePool.address);

    await dai.connect(dai_whale).transfer(yieldSourcePrizePool.address, SUPPLY_TOKENS);

    await yieldSourcePrizePool.connect(lottery).depositTo(dai_whale.address, SUPPLY_TOKENS);
    await time.increase(14*24*3600); // rewind the time 2 weeks ahead

    expect(await prizeStrategy.connect(lottery).getPrize()).to.greaterThan(ethers.constants.Zero);    
  })

  it("Should set prizePool address", async function () {
    const {owner, prizeStrategy, lottery} = await loadFixture(deployFixture);
    const [, , ,prizePoolTestAddr] = await ethers.getSigners();
    await prizeStrategy.setPrizePool(prizePoolTestAddr.address);

    // Revert: PrizeStrategy/_prizePool-address-not-zero
    await expect(prizeStrategy.setPrizePool(ethers.constants.AddressZero)).to.be.revertedWith("PrizeStrategy/_prizePool-address-not-zero");
    
    // Revert: Ownable: caller is not the owner
    await expect(prizeStrategy.connect(lottery).setPrizePool(prizePoolTestAddr.address)).to.be.revertedWith("Ownable: caller is not the owner");
  })

  it("Should set lottery address", async function () {
    const {prizeStrategy, lottery} = await loadFixture(deployFixture);
    const [, , ,lotteryAddress] = await ethers.getSigners();
    await prizeStrategy.setLottery(lotteryAddress.address);
    expect(await prizeStrategy.getLottery()).to.eq(lotteryAddress.address);
    
    // Revert: Ownable: caller is not the owner
    await expect(prizeStrategy.connect(lottery).setLottery(ethers.constants.AddressZero)).to.be.revertedWith("Ownable: caller is not the owner");

    // Revert: PrizeStrategy/_lottery-address-not-zero
    await expect(prizeStrategy.setLottery(ethers.constants.AddressZero)).to.be.revertedWith("PrizeStrategy/_lottery-address-not-zero");
  })
});
