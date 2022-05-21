const { expect } = require("chai");
const { ethers } = require("hardhat");

let hardhatToken;
let owner;
let addr1;
let addr2;
let addrs;
let Token;
var MILISECOND = 1000; // 1 cliff = 12s
beforeEach(async () => {
  myToken = await ethers.getContractFactory("IDO");
  [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  hardhatToken = await myToken.deploy();
});

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});
describe("Funding Transaction", function () {
  it("Check owner blance after vesting", async function () {
    await hardhatToken.connect(owner).fundVesting();
    const ownerBalanceAfter = await hardhatToken.balanceOf(owner.address);
    expect(ownerBalanceAfter).to.equal(0);
  });
});

describe("Single Transaction", function () {
  it("User 1 buy 1000 Token and first claim", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken.connect(owner).fundVesting();

    // await new Promise((resolve) => setTimeout(resolve, MILISECOND));
    await hardhatToken.connect(addr1).claim();
    const addr1Balance = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(
      ethers.BigNumber.from("200000000000000000000")
    );

    // expect(ownerBalanceAfter).to.equal(0);
  });
  it("User 1 buy 1000 Token and first claim and second claim is 4 month after cliff", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken.connect(owner).fundVesting();

    await hardhatToken.connect(addr1).claim();
    await new Promise((resolve) => setTimeout(resolve, 24000));
    await hardhatToken.connect(addr1).claim();
    const addr1Balance = await hardhatToken.balanceOf(addr1.address);

    expect(addr1Balance).to.equal(
      ethers.BigNumber.from("600000000000000000000")
    );
  });
  it("User 1 buy 1000 Token and first claim and second claim and third claim 10%", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken.connect(owner).fundVesting();
    // first claim
    await hardhatToken.connect(addr1).claim();

    // second claim
    await new Promise((resolve) => setTimeout(resolve, 25000));
    await hardhatToken.connect(addr1).claim();

    await new Promise((resolve) => setTimeout(resolve, 1000)); // third claim
    await hardhatToken.connect(addr1).claim();
    const addr1Balance2 = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance2).to.equal(
      ethers.BigNumber.from("700000000000000000000")
    );

    // expect(ownerBalanceAfter).to.equal(0);
  });
  it("User 1 buy 1000 Token and first claim and second claim and third claim all%", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken.connect(owner).fundVesting();
    // first claim
    await hardhatToken.connect(addr1).claim();

    // second claim
    await new Promise((resolve) => setTimeout(resolve, 12000));
    await hardhatToken.connect(addr1).claim();

    // third claim
    await new Promise((resolve) => setTimeout(resolve, 5000)); // third claim
    await hardhatToken.connect(addr1).claim();
    const addr1Balance2 = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance2).to.equal(
      ethers.BigNumber.from("1000000000000000000000")
    );

    // expect(ownerBalanceAfter).to.equal(0);
  });

  it("User 1 buy 2000 Token and fail", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(2000, { value: ethers.utils.parseEther("2.0") });

    // const ownerBalanceAfter = await hardhatToken.balanceOf(owner.address);
    // expect(ownerBalanceAfter).to.equal(0);
  });
});

describe("more than 1 transaction", function () {
  it("User 1 buy 1000 Token and user 2 buy 1000 Token and claim", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken
      .connect(addr2)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });

    await hardhatToken.connect(owner).fundVesting();
    // first claim
    await hardhatToken.connect(addr1).claim();

    // second claim
    await new Promise((resolve) => setTimeout(resolve, 12000));
    await hardhatToken.connect(addr1).claim();

    // third claim
    await new Promise((resolve) => setTimeout(resolve, 5000)); // third claim
    await hardhatToken.connect(addr1).claim();
    const addr1Balance2 = await hardhatToken.balanceOf(addr1.address);
    expect(addr1Balance2).to.equal(
      ethers.BigNumber.from("1000000000000000000000")
    );
    await hardhatToken.connect(addr2).claim();
    const addr2Balance = await hardhatToken.balanceOf(addr1.address);
    expect(addr2Balance).to.equal(
      ethers.BigNumber.from("1000000000000000000000")
    );
  });

  it(" fail when User 1 buy 1000 Token and user 2 buy 1000 Token and user 3 buy 1000 Token", async function () {
    await hardhatToken
      .connect(addr1)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken
      .connect(addr2)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken
      .connect(addr3)
      .joinWhiteList(1000, { value: ethers.utils.parseEther("1.0") });
    await hardhatToken.connect(owner).fundVesting();
    // first claim
    await hardhatToken.connect(addr1).claim();
  });
});
