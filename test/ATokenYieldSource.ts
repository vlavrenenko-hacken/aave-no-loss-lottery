import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import {DAI_ADDR, aDAI_ADDR, DAI_WHALE, AAVE_POOL_ADDRESS_PROVIDER, POOL_ADDR} from "./config.js";
import IERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import IPool from "../artifacts/@aave/core-v3/contracts/interfaces/IPool.sol/IPool.json";
import IAToken from "../artifacts/contracts/interfaces/IAToken.sol/IAToken.json";

describe("ATokenYieldSource Test", function () {
  const SUPPLY_TOKENS = ethers.utils.parseEther("1000000");
  async function deployFixture() {
    const [owner] = await ethers.getSigners();

    const dai = await ethers.getContractAt(IERC20.abi, DAI_ADDR);
    const aDai = await ethers.getContractAt(IAToken.abi, aDAI_ADDR);
    const pool = await ethers.getContractAt(IPool.abi, POOL_ADDR);

    const ATokenYieldSource = await ethers.getContractFactory("ATokenYieldSource");
    const aTokenYieldSource = await ATokenYieldSource.deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI");
    await aTokenYieldSource.deployed();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DAI_WHALE],
    });
    const dai_whale = await ethers.getSigner(DAI_WHALE)

    return {aTokenYieldSource, dai, aDai, owner, dai_whale, pool};
  }

  it("Deployment", async function () {
    const {aTokenYieldSource, dai, aDai, owner} = await loadFixture(deployFixture);
    expect(await aTokenYieldSource.aToken()).to.eq(aDai.address);
    expect(await aTokenYieldSource.poolAddressesProvider()).to.eq(AAVE_POOL_ADDRESS_PROVIDER);
    expect(await aTokenYieldSource.owner()).to.eq(owner.address);
    expect(await aTokenYieldSource.name()).to.eq("Shares DAI");
    expect(await aTokenYieldSource.symbol()).to.eq("SHD");
    expect(await aTokenYieldSource.decimals()).to.eq(18);
    expect(await aTokenYieldSource.depositToken()).to.eq(dai.address);
    expect(await dai.allowance(aTokenYieldSource.address, POOL_ADDR)).to.eq(ethers.constants.MaxUint256);
   
    const ATokenYieldSource = await ethers.getContractFactory("ATokenYieldSource");

    const tx = await ATokenYieldSource.connect(owner).deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI");
    const receipt = await tx.deployTransaction.wait();
    
    // Emit: Approval
    const Approval = receipt.events?.filter(e => e.event == "Approval");
    const args1 = Approval[0].args;
    expect(args1.owner).to.eq(tx.address);
    expect(args1.spender).to.eq(POOL_ADDR);
    expect(args1.value).to.eq(ethers.constants.MaxUint256);

    // Emit: ATokenYieldSourceInitialized
    const ATokenYieldSourceInitialized = receipt.events?.filter(e => e.event == "ATokenYieldSourceInitialized");
    const args2 = ATokenYieldSourceInitialized[0].args;
    expect(args2.aToken).to.eq(aDAI_ADDR);
    expect(args2.poolAddressesProvider).to.eq(AAVE_POOL_ADDRESS_PROVIDER);
    expect(args2.decimals).to.eq(ethers.BigNumber.from("18"));
    expect(args2.name).to.eq("Shares DAI");
    expect(args2.symbol).to.eq("SHD");
    expect(args2.owner).to.eq(owner.address);

    // Revert: ATokenYieldSource/aToken-not-zero-address
    await expect(ATokenYieldSource.deploy(ethers.constants.AddressZero, AAVE_POOL_ADDRESS_PROVIDER, 18, "SHD", "Shares DAI")).to.be.revertedWith("ATokenYieldSource/aToken-not-zero-address");

    // Revert: poolAddressesProvider-not-zero-address"
    await expect(ATokenYieldSource.deploy(aDAI_ADDR, ethers.constants.AddressZero, 18, "SHD", "Shares DAI")).to.be.revertedWith("ATokenYieldSource/poolAddressesProvider-not-zero-address");

    // Revert: ATokenYieldSource/decimals-are-different
    await expect(ATokenYieldSource.deploy(aDAI_ADDR, AAVE_POOL_ADDRESS_PROVIDER, 0, "SHD", "Shares DAI")).to.be.revertedWith("ATokenYieldSource/decimals-are-different");

  });

  it("Should deposit 1kk DAI to Aave pool for 2 weeks", async function() {
    const {aTokenYieldSource, dai, aDai, owner, dai_whale} = await loadFixture(deployFixture);
    expect(await dai.connect(dai_whale).approve(aTokenYieldSource.address, SUPPLY_TOKENS)).to.emit(dai.address, "Approval").withArgs(dai_whale.address, aTokenYieldSource.address, SUPPLY_TOKENS);
    expect(await aTokenYieldSource.connect(owner).supplyTokenTo(dai_whale.address, dai_whale.address, SUPPLY_TOKENS)).to
    .emit(aTokenYieldSource.address, "Transfer").withArgs(dai_whale.address, aTokenYieldSource.address, SUPPLY_TOKENS)
    .emit(aTokenYieldSource.address, "Transfer").withArgs(ethers.constants.AddressZero, dai_whale.address, SUPPLY_TOKENS)
    .emit(aTokenYieldSource.address, "SuppliedTokenTo").withArgs(dai_whale.address, dai_whale.address, aTokenYieldSource.address, SUPPLY_TOKENS, SUPPLY_TOKENS);
    
    expect(await aTokenYieldSource.totalSupply()).to.eq(SUPPLY_TOKENS);
    expect(await aDai.balanceOf(aTokenYieldSource.address)).to.eq(SUPPLY_TOKENS);

    await time.increase(14*24*3600); // rewind the time two weeks ahead

    expect(await aTokenYieldSource.balanceOf(dai_whale.address)).to.eq(SUPPLY_TOKENS); // shares
    expect(await aTokenYieldSource.getTotalInterest()).to.greaterThan(ethers.constants.Zero); 
    expect(await aTokenYieldSource.totalBalance()).to.greaterThan(SUPPLY_TOKENS);
   

    // Revert: ERC20: transfer amount exceeds balance
    await expect(aTokenYieldSource.supplyTokenTo(dai_whale.address, dai_whale.address, ethers.utils.parseEther("1"))).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

    // Revert: ATokenYieldSource/tokens-gt-zero
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, ethers.utils.parseEther("1"));
    await expect(aTokenYieldSource.supplyTokenTo(dai_whale.address, dai_whale.address, ethers.constants.Zero)).to.be.revertedWith("ATokenYieldSource/tokens-gt-zero");

    // Revert: ATokenYieldSource/sender-not-zero-address
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, ethers.utils.parseEther("1"));
    await expect(aTokenYieldSource.supplyTokenTo(ethers.constants.AddressZero, dai_whale.address, ethers.utils.parseEther("1"))).to.be.revertedWith("ATokenYieldSource/sender-not-zero-address");
    
    // Revert: ATokenYieldSource/receiver-not-zero-address
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, ethers.utils.parseEther("1"));
    await expect(aTokenYieldSource.supplyTokenTo(dai_whale.address, ethers.constants.AddressZero, ethers.utils.parseEther("1"))).to.be.revertedWith("ATokenYieldSource/receiver-not-zero-address");

    // Revert: Ownable: caller is not the owner
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, ethers.utils.parseEther("1"));
    await expect(aTokenYieldSource.connect(dai_whale).supplyTokenTo(dai_whale.address, dai_whale.address, ethers.utils.parseEther("1"))).to.be.revertedWith("Ownable: caller is not the owner");
  })
  
 
  it("Should redeem DAI from the Aave pool", async function() {
    const {aTokenYieldSource, dai, aDai, owner, dai_whale, pool} = await loadFixture(deployFixture);
    const redeemAmount = SUPPLY_TOKENS.div(10); // 100.000 DAI

    await dai.connect(dai_whale).approve(aTokenYieldSource.address, SUPPLY_TOKENS);
    await aTokenYieldSource.connect(owner).supplyTokenTo(dai_whale.address, dai_whale.address, SUPPLY_TOKENS);
    await time.increase(14*24*3600); // rewind the time two weeks ahead

    const balance_ATokenYieldSource = await aDai.balanceOf(aTokenYieldSource.address); // initialBalance + interest
    const balance_DAI_WHALE = await dai.balanceOf(dai_whale.address);
    const balance_Before_DAI_WHALE_SHARES = await aTokenYieldSource.balanceOf(dai_whale.address); // shares
    
    const interestAccrued = await aTokenYieldSource.getTotalInterest();

    expect(await aTokenYieldSource.connect(owner).redeemToken(dai_whale.address, dai_whale.address, redeemAmount)).
    to.emit(aTokenYieldSource.address, "Transfer").withArgs(dai_whale.address, ethers.constants.AddressZero, redeemAmount).
    to.emit(aTokenYieldSource.address, "RedeemedToken").withArgs(dai_whale.address, dai_whale.address, redeemAmount, redeemAmount);
    
    expect(balance_ATokenYieldSource.sub(redeemAmount)).to.lessThanOrEqual(await aDai.balanceOf(aTokenYieldSource.address));
    expect(await dai.balanceOf(dai_whale.address)).to.eq(balance_DAI_WHALE.add(redeemAmount));
    expect(await aTokenYieldSource.balanceOf(dai_whale.address)).to.eq(balance_Before_DAI_WHALE_SHARES.sub(redeemAmount));
    expect(await aTokenYieldSource.getTotalInterest()).to.greaterThanOrEqual(interestAccrued)


    // Revert: ATokenYieldSource/tokens-gt-zero
    await expect(aTokenYieldSource.connect(owner).redeemToken(dai_whale.address, dai_whale.address, ethers.constants.Zero)).to.be.revertedWith("ATokenYieldSource/tokens-gt-zero");

    // Revert: ATokenYieldSource/sender-not-zero-address
    await expect(aTokenYieldSource.connect(owner).redeemToken(ethers.constants.AddressZero, dai_whale.address, redeemAmount)).to.be.revertedWith("ATokenYieldSource/sender-not-zero-address");
     
    // Revert: ATokenYieldSource/receiver-not-zero-address
    await expect(aTokenYieldSource.connect(owner).redeemToken(dai_whale.address, ethers.constants.AddressZero, redeemAmount)).to.be.revertedWith("ATokenYieldSource/receiver-not-zero-address");
 
    // Revert: Ownable: caller is not the owner
    await expect(aTokenYieldSource.connect(dai_whale).redeemToken(dai_whale.address, dai_whale.address, redeemAmount)).to.be.revertedWith("Ownable: caller is not the owner");

    // Revert: ERC20: burn amount exceeds balance
    await expect(aTokenYieldSource.connect(owner).redeemToken(dai_whale.address, dai_whale.address, SUPPLY_TOKENS.mul(2))).to.be.revertedWith("ERC20: burn amount exceeds balance");

  })
  it("Should withdraw interest", async function() {
    const {aTokenYieldSource, dai, owner, dai_whale} = await loadFixture(deployFixture);
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, SUPPLY_TOKENS)
    await aTokenYieldSource.connect(owner).supplyTokenTo(dai_whale.address, dai_whale.address, SUPPLY_TOKENS);
    
    await time.increase(14*24*3600); // rewind the time two weeks ahead

    expect(await aTokenYieldSource.balanceOf(dai_whale.address)).to.eq(SUPPLY_TOKENS); // shares
    expect(await aTokenYieldSource.getTotalInterest()).to.be.greaterThan(ethers.constants.Zero); // CALCULATE THE INTEREST RATE USING AAVE DEPOSIT % FORMULA
    expect(await aTokenYieldSource.totalBalance()).to.be.greaterThan(SUPPLY_TOKENS);
   
    const daiBal = await dai.balanceOf(owner.address);
    expect(daiBal).to.eq(ethers.constants.Zero);
    const interestAccrued = await aTokenYieldSource.getTotalInterest();
    expect(await aTokenYieldSource.withdrawInterest(owner.address)).to.emit(aTokenYieldSource.address, "Claimed").withArgs(owner.address, interestAccrued);
    expect(await dai.balanceOf(owner.address)).to.greaterThanOrEqual(interestAccrued);

    // Revert: Ownable: caller is not the owner
    await expect(aTokenYieldSource.connect(dai_whale).withdrawInterest(owner.address)).to.be.revertedWith("Ownable: caller is not the owner");
    
    // Revert: ATokenYieldSource/recipient-not-zero-address
    await expect(aTokenYieldSource.connect(owner).withdrawInterest(ethers.constants.AddressZero)).to.be.revertedWith("ATokenYieldSource/recipient-not-zero-address");
  })
  it("ERC20 functionality Test", async function() {
    const {aTokenYieldSource, owner, dai, dai_whale} = await loadFixture(deployFixture);
    expect(await aTokenYieldSource.owner()).to.eq(owner.address);
    expect(await aTokenYieldSource.transferOwnership(dai_whale.address)).to.emit(aTokenYieldSource.address, "OwnershipTransferred").withArgs(owner.address, dai_whale.address);
    
    await dai.connect(dai_whale).approve(aTokenYieldSource.address, SUPPLY_TOKENS)
    await aTokenYieldSource.connect(dai_whale).supplyTokenTo(dai_whale.address, dai_whale.address, SUPPLY_TOKENS);
    expect(await aTokenYieldSource.balanceOf(dai_whale.address)).to.eq(SUPPLY_TOKENS);

    // Revert: Ownable: new owner is the zero address
    await expect(aTokenYieldSource.connect(dai_whale).transferOwnership(ethers.constants.AddressZero)).to.be.revertedWith("Ownable: new owner is the zero address");
    
    // Revert: ERC20: transfer from the zero address
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ethers.constants.AddressZero],
    });
    const zero_signer = await ethers.getSigner(ethers.constants.AddressZero)
    await expect(aTokenYieldSource.connect(zero_signer).transfer(dai_whale.address, SUPPLY_TOKENS)).to.be.revertedWith("ERC20: transfer from the zero address");

    // Revert: ERC20: transfer to the zero address
    await expect(aTokenYieldSource.connect(dai_whale).transfer(ethers.constants.AddressZero, SUPPLY_TOKENS)).to.be.revertedWith("ERC20: transfer to the zero address");

    // Revert: ERC20: approve from the zero address
    await expect(aTokenYieldSource.connect(zero_signer).approve(dai_whale.address, SUPPLY_TOKENS)).to.be.revertedWith("ERC20: approve from the zero address");

    // Revert: ERC20: approve to the zero address
    await expect(aTokenYieldSource.connect(dai_whale).approve(ethers.constants.AddressZero, SUPPLY_TOKENS)).to.be.revertedWith("ERC20: approve to the zero address");
  })
});
