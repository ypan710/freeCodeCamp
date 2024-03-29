const {getNamedAccounts, network, ethers} = require("hardhat")
const {assert} = require("chai")
const {developmentChains} = require("../../helper-hardhat-config")

// only runs test if not on development chain
developmentChains.includes(network.name) ? describe.skip : describe("FundMe", async function () {
    describe("FundMe", async function () {
        let fundMe
        let deployer
        const sendValue = ethers.utils.parseEther("0.1")
        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer
            fundMe = await ethers.getContract("FundMe", deployer)
        })
        it("allows people to fund and withdraw", async function () {
            await fundMe.fund({value: sendValue})
            await fundMe.withdraw()
            const endingbalance = await fundMe.provider.getBalance(fundMe.address);
            assert.equal(endingbalance.toString(), "0")
        })
    })

})
