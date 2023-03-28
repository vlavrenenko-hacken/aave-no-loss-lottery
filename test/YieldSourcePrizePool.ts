import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {DAI_ADDR, aDAI_ADDR, DAI_WHALE, AAVE_POOL_ADDRESS_PROVIDER} from "./config.js";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import IAToken from "../artifacts/contracts/interfaces/IAToken.sol/IAToken.json";

describe("YieldSourcePrizePool Test", function () {
  const SUPPLY_TOKENS = ethers.utils.parseEther("100000");
  async function deployFixture() {
    const [owner, prizeStrategy, lottery] = await ethers.getSigners();

    const ATokenYieldSource = await ethers.getContractFactory("ATokenYieldSource");
    const aTokenYieldSource = await ATokenYieldSource.deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI");
    await aTokenYieldSource.deployed();

    const YieldSourcePrize = await ethers.getContractFactory("YieldSourcePrizePool");
    const yieldSourcePrize = await YieldSourcePrize.deploy(aTokenYieldSource.address, prizeStrategy.address, lottery.address);
    await yieldSourcePrize.deployed();

    await aTokenYieldSource.transferOwnership(yieldSourcePrize.address);
    
    const dai = await ethers.getContractAt(IERC20.abi, DAI_ADDR);
    const aDai = await ethers.getContractAt(IAToken.abi, aDAI_ADDR);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DAI_WHALE],
    });
    const dai_whale = await ethers.getSigner(DAI_WHALE)
    return {owner, aTokenYieldSource, yieldSourcePrize, prizeStrategy, lottery, dai_whale, dai, aDai};
  }
  it("Deployment", async function() {
    const {owner, aTokenYieldSource, yieldSourcePrize, prizeStrategy, lottery} = await loadFixture(deployFixture);
    expect(await yieldSourcePrize.yieldSource()).to.eq(aTokenYieldSource.address);
    expect(await yieldSourcePrize.prizeStrategy()).to.eq(prizeStrategy.address);
    expect(await yieldSourcePrize.lottery()).to.eq(lottery.address);
  });

  it("Should deposit 100k DAI to YieldSource", async function() {
    const {owner, yieldSourcePrize, lottery, dai_whale, dai} = await loadFixture(deployFixture);
    await dai.connect(dai_whale).transfer(yieldSourcePrize.address, SUPPLY_TOKENS);
    const balBefore = await yieldSourcePrize.balance();
    await yieldSourcePrize.connect(lottery).depositTo(dai_whale.address, SUPPLY_TOKENS);
    expect(balBefore.add(SUPPLY_TOKENS)).to.lessThanOrEqual(await yieldSourcePrize.balance());
    expect(await yieldSourcePrize.balanceOfUser(dai_whale.address)).to.eq(SUPPLY_TOKENS);


    // Revert: YieldSourcePrizePool/not-lottery
    await expect(yieldSourcePrize.connect(owner).depositTo(dai_whale.address, SUPPLY_TOKENS)).to.be.revertedWith("YieldSourcePrizePool/not-lottery");

    // Revert: YieldSourcePrizePool/to-not-zero-address
    await expect(yieldSourcePrize.connect(lottery).depositTo(ethers.constants.AddressZero, SUPPLY_TOKENS)).to.be.revertedWith("YieldSourcePrizePool/to-not-zero-address");

    // Revert: YieldSourcePrizePool/tokens-gt-zero
    await expect(yieldSourcePrize.connect(lottery).depositTo(dai_whale.address, ethers.constants.Zero)).to.be.revertedWith("YieldSourcePrizePool/tokens-gt-zero");
  })

  it("Should withdraw 100k DAI from YieldSource", async function() {
    const {aTokenYieldSource, yieldSourcePrize, lottery, dai_whale, dai} = await loadFixture(deployFixture);
    await dai.connect(dai_whale).transfer(yieldSourcePrize.address, SUPPLY_TOKENS);

    await yieldSourcePrize.connect(lottery).depositTo(dai_whale.address, SUPPLY_TOKENS);
    const balDAIBefore = await dai.balanceOf(dai_whale.address);
    const totalABalanceBefore = await aTokenYieldSource.totalBalance()
    await yieldSourcePrize.connect(lottery).withdrawFrom(dai_whale.address, dai_whale.address, SUPPLY_TOKENS);
    expect(await yieldSourcePrize.balanceOfUser(dai_whale.address)).to.eq(ethers.constants.Zero);
    
    expect(totalABalanceBefore.sub(SUPPLY_TOKENS)).to.lessThanOrEqual(await aTokenYieldSource.totalBalance());
    expect(await dai.balanceOf(dai_whale.address)).to.eq(balDAIBefore.add(SUPPLY_TOKENS));

    // Revert: YieldSourcePrizePool/from-not-zero-address
    await expect(yieldSourcePrize.connect(lottery).withdrawFrom(ethers.constants.AddressZero, dai_whale.address, SUPPLY_TOKENS)).to.be.revertedWith("YieldSourcePrizePool/from-not-zero-address");

    // Revert: YieldSourcePrizePool/to-not-zero-address
    await expect(yieldSourcePrize.connect(lottery).withdrawFrom(dai_whale.address, ethers.constants.AddressZero, SUPPLY_TOKENS)).to.be.revertedWith("YieldSourcePrizePool/to-not-zero-address"); 
    
    // Revert: YieldSourcePrizePool/not-lottery
    await expect(yieldSourcePrize.connect(dai_whale).withdrawFrom(dai_whale.address, dai_whale.address, SUPPLY_TOKENS)).to.be.revertedWith("YieldSourcePrizePool/not-lottery");
  })

  it("Should claim interest in 2 weeks", async function() {
    const {yieldSourcePrize, prizeStrategy, lottery, dai_whale, dai} = await loadFixture(deployFixture);
    await dai.connect(dai_whale).transfer(yieldSourcePrize.address, SUPPLY_TOKENS);

    await yieldSourcePrize.connect(lottery).depositTo(dai_whale.address, SUPPLY_TOKENS);
    await time.increase(14*24*3600); // rewind the time two weeks ahead
    
    expect(await yieldSourcePrize.getInterest()).to.greaterThan(ethers.constants.Zero);
    await yieldSourcePrize.connect(prizeStrategy).claimInterest();
    expect(await dai.balanceOf(prizeStrategy.address)).to.be.greaterThan(ethers.constants.Zero);
    
    // Revert: YieldSourcePrizePool/not-strategy
    await expect(yieldSourcePrize.claimInterest()).to.be.revertedWith("YieldSourcePrizePool/not-strategy");
  })

  it("Should set the lottery address", async function() {
    const {yieldSourcePrize, prizeStrategy, lottery, dai_whale, dai} = await loadFixture(deployFixture);
    const [,notowner , ,lotteryAddr] = await ethers.getSigners();
    await yieldSourcePrize.setLottery(lotteryAddr.address);
    expect(await yieldSourcePrize.lottery()).to.eq(lotteryAddr.address);

    // Revert: YieldSourcePrizePool/_lottery-address-not-zero
    await expect(yieldSourcePrize.setLottery(ethers.constants.AddressZero)).to.be.revertedWith("YieldSourcePrizePool/_lottery-address-not-zero");

    // Revert: Ownable: caller is not the owner
    await expect(yieldSourcePrize.connect(notowner).setLottery(lotteryAddr.address)).to.be.revertedWith("Ownable: caller is not the owner");
  })

});
