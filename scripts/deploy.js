async function main() {
  // Get the ContractFactory and signers from the Hardhat runtime
  
  const secureAccount = hre.ethers.secureAccount.deployContract();
  console.log('Deploying SecureAccount...');
  await secureAccount.waitForDeployment();

  console.log('SecureAccount contract deployed to:', secureAccount.address);
}

// Run the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
