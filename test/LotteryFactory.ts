import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {DAI_ADDR} from "./config.js";

describe("LotteryFactory Test", function () {
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    
    const ClonesMock = await ethers.getContractFactory("ClonesMock");
    const clonesMock = await ClonesMock.deploy();
    await clonesMock.deployed();

    const LotteryImpl = await ethers.getContractFactory("Lottery");
    const lotteryImpl = await LotteryImpl.deploy();
    await lotteryImpl.deployed();

    const LotteryFactory = await ethers.getContractFactory("LotteryFactory");
    const lotteryFactory = await LotteryFactory.deploy(lotteryImpl.address);
    await lotteryFactory.deployed();
    
    return {lotteryImpl, lotteryFactory, owner, otherAccount, clonesMock}
}

  it("Deployment", async function () {
    const {lotteryImpl, lotteryFactory, owner} = await loadFixture(deployFixture);
    expect(await lotteryFactory.lotteryImplementation()).to.eq(lotteryImpl.address);
    expect(await lotteryFactory.owner()).to.eq(owner.address);
  });

  it("Create Lottery", async function() {
    const {lotteryImpl, lotteryFactory, owner, otherAccount, clonesMock} = await loadFixture(deployFixture);
    const timeInterval = ethers.BigNumber.from("1209600"); // 2 weeks  
    const salt = ethers.utils.solidityKeccak256(["address", "uint256"], [owner.address, (await ethers.provider.getBlock("latest")).timestamp]);

    const predictedAddress = await clonesMock.predictAddress(lotteryImpl.address, salt, lotteryFactory.address);
    const lotteryAddress = await lotteryFactory.callStatic.createLottery(DAI_ADDR, ethers.utils.parseEther("100"), timeInterval);
    expect(predictedAddress).to.eq(lotteryAddress);

    expect(await lotteryFactory.callStatic.createLottery(DAI_ADDR, ethers.utils.parseEther("100"), timeInterval)).to.emit(lotteryFactory.address, "LotteryCreated").withArgs(owner.address, DAI_ADDR, ethers.utils.parseEther("100"), timeInterval);

    // Revert: LotteryFactory/tokenAddress-not-zero-address
    await expect(lotteryFactory.createLottery(ethers.constants.AddressZero, ethers.utils.parseEther("100"), timeInterval)).to.be.revertedWith("LotteryFactory/tokenAddress-not-zero-address");

    // Revert: LotteryFactory/ticketPrice-not-zero-value
    await expect(lotteryFactory.createLottery(DAI_ADDR, ethers.constants.Zero, timeInterval)).to.be.revertedWith("LotteryFactory/ticketPrice-not-zero-value");

    // Revert: Lottery/interval-not-zero
    await expect(lotteryFactory.createLottery(DAI_ADDR, ethers.utils.parseEther("100"), ethers.constants.Zero)).to.be.revertedWith("Lottery/interval-not-zero");

    // Revert: Ownable: caller is not the owner
    await expect(lotteryFactory.connect(otherAccount).createLottery(DAI_ADDR, ethers.utils.parseEther("100"), timeInterval)).to.be.revertedWith("Ownable: caller is not the owner");

  })

  it("Set lottery implementation", async function() {
    const {lotteryFactory, owner, otherAccount, clonesMock} = await loadFixture(deployFixture);
    const LotteryImpl = await ethers.getContractFactory("Lottery");
    const lotteryImplNew = await LotteryImpl.deploy();
    await lotteryImplNew.deployed();

    await lotteryFactory.setLotteryImplementation(lotteryImplNew.address);
    expect(await lotteryFactory.lotteryImplementation()).to.eq(lotteryImplNew.address);
    
    // Revert: LotteryFactory/implementation-not-zero-address
    await expect(lotteryFactory.setLotteryImplementation(ethers.constants.AddressZero)).to.be.revertedWith("LotteryFactory/implementation-not-zero-address");

    // Revert: Ownable: caller is not the owner
    await expect(lotteryFactory.connect(otherAccount).setLotteryImplementation(lotteryImplNew.address)).to.be.revertedWith("Ownable: caller is not the owner");
  })
});