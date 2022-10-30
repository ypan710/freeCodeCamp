const {assert, expect} = require("chai")
const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {developmentChains} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip : describe("FundMe", function () {
    let fundMe,
        deployer,
        mockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async function () { // deploy our fundme contract using hardhat deploy
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
    })

    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async function () {
            const response = await fundMe.s_priceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", function () {
        it("should fail if not enough ether is sent", async function () {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })
        it("updates the amount funded data structure", async function () {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.s_addressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString())
        })
        it("adds funder to array of s_funders", async function () {
            await fundMe.fund({value: sendValue})
            const funder = await fundMe.s_funders(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", function () {
        beforeEach(async function () {
            await fundMe.fund({value: sendValue})
        })
        it("withdraw ETH from a single funder", async function () { // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // Act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait(1)
            const {gasUsed, effectiveGasPrice} = txReceipt
            const gasCost = effectiveGasPrice.mul(gasUsed)

            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Assert
            // ending fundme balance should be 0 because we withdrew all funds
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

        })
        it("allows us to withdraw with multiple s_funders", async function () {
            // Arrange
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: sendValue})
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Act
            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait(1)
            const {gasUsed, effectiveGasPrice} = txReceipt
            const gasCost = effectiveGasPrice.mul(gasUsed)

            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            // Assert
            // ending fundme balance should be 0 because we withdrew all funds
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

            // Make sure that the s_funders are reset properly
            await expect(fundMe.s_funders(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0)
            }

        })
        it("only allows owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner")
        })
    })
})
