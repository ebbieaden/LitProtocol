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
    
    const publicKeyBytes = ethers.toBeHex('publicKey');
    const recoveryCode = 'recoveryCode';

    const mfaSetupTx = await secureAccount.setupMFA(publicKeyBytes, recoveryCode);
    await mfaSetupTx.wait();

    //ethers.AbiCoder.defaultAbiCoder().decode(["uint"], VARIABLE_NAME for the bytes variables
    const storedPublicKeyBytes = await secureAccount.getPublicKey(owner.address);
    const storedPublicKey = ethers.AbiCoder.defaultAbiCoder().decode(['bytes'], storedPublicKeyBytes)[0];
    expect(storedPublicKey).to.equal('publicKey');
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

    const newPublicKeyBytes = await secureAccount.getPublicKey(owner.address);
    const newPublicKey = ethers.AbiCoder.defaultAbiCoder().decode(['bytes'], newPublicKeyBytes)[0];
    expect(newPublicKey).to.equal('new-public-key')
  });
});
