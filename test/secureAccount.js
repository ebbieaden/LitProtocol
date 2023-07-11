const { expect } = require('chai');
const hre = require("hardhat");
const { ethers } = require("hardhat");

describe('SecureAccount', function () {
  let secureAccount;
  let owner;

  beforeEach(async function () {
    secureAccount = await hre.ethers.deployContract('SecureAccount');
    [owner] = await ethers.getSigners();
    await secureAccount.waitForDeployment();
  });

  it('should register a user', async function () {
    const registerTx = await secureAccount.registerUser('user1', 'passwordHash');
    await registerTx.wait();

    expect(await secureAccount.isRegistered(owner.address)).to.be.true;
  });

  it('should setup MFA', async function () {
    await secureAccount.registerUser('user1', 'passwordHash');

    const mfaSetupTx = await secureAccount.setupMFA('publicKey', 'recoveryCode');
    await mfaSetupTx.wait();

    expect(await secureAccount.getPublicKey(owner.address)).to.equal('publicKey');
  });

  it('should authenticate successfully', async function () {
    await secureAccount.registerUser('user1', 'passwordHash');
    await secureAccount.setupMFA('publicKey', 'recoveryCode');

    const authenticateResult = await secureAccount.authenticate('user1', 'passwordHash', 'otp');
    expect(authenticateResult).to.be.true;
  });

  it('should not authenticate with incorrect OTP', async function () {
    await secureAccount.registerUser('user1', 'passwordHash');
    await secureAccount.setupMFA('publicKey', 'recoveryCode');

    const authenticateResult = await secureAccount.authenticate('user1', 'passwordHash', 'incorrectOTP');
    expect(authenticateResult).to.be.false;
  });

  it('should recover account', async function () {
    await secureAccount.registerUser('user1', 'passwordHash');
    await secureAccount.setupMFA('publicKey', 'recoveryCode');

    const recoverTx = await secureAccount.recoverAccount('user1', 'recoveryCode');
    await recoverTx.wait();

    expect(await secureAccount.getPublicKey(owner.address)).to.equal('new-public-key');
  });
});
