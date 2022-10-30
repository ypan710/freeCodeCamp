const {task} = require("hardhat/config")

task("block-number", "Print the current block number").setAction(async (taskArg, hre) => {
    const blocknumber = await hre.ethers.provider.getBlockNumber()
    console.log(`Current blocknumber is ${blocknumber}`)
})
