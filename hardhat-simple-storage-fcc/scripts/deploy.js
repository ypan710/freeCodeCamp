const {ethers, run, network} = require("hardhat")

async function main() {
    const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage")
    console.log("Deploying contract...")
    const simpleStorage = await SimpleStorageFactory.deploy()
    await simpleStorage.deployed()
    console.log(`Deployed contract to: ${
        simpleStorage.address
    }`)

    if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for block transactions...")
        await simpleStorage.deployTransaction.wait(6);
        await verify(simpleStorage.address, [])
    }

    // console.log(network.config)

    // get current value
    const currentValue = await simpleStorage.retrieve()
    console.log(`Current value is ${currentValue}`)

    // update the current value
    const txResponse = await simpleStorage.store(1)
    await txResponse.wait(1)
    const updatedValue = await simpleStorage.retrieve()
    console.log(`Updated value is ${
        updatedValue
    }`)


    async function verify(contractAddress, args) {
        console.log("Verifying contract...")
        try {
            await run("verify:verify", {
                address: contractAddress,
                constructorArgs: args
            })
        } catch (e) {
            if (e.message.toLowerCase().includes("already verified")) {
                console.log("Already verified!")
            } else {
                console.log(e)
            }

        }
    }
}

// main
main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
