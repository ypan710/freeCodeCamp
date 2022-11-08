import {ethers} from "./ethers-5.6.esm.min.js"
import {abi, contractAddress} from "./constants.js"


const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
withdrawButton.onclick = withdraw
balanceButton.onclick = getBalance
connectButton.onclick = connect
fundButton.onclick = fund

console.log(ethers)

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({method: "eth_requestAccounts"})
        connectButton.innerHTML = "Connected!"
    } else {
        fundButton.innerHTML = "Please install Metamask!"
    }
}

// fund function
async function fund() {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount} ethers`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner() // get wallet connected to provider
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const txResponse = await contract.fund({value: ethers.utils.parseEther(ethAmount)})
            // await txResponse.wait(1)
            await listenForTxMined(txResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
        fundButton.innerHTML = "Account has been funded!"
    } else {
        fundButton.innerHTML = "Please fund your account!"
    }
}

function listenForTxMined(txResponse, provider) {
    console.log(`Mining ${
        txResponse.hash
    }...`)
    return new Promise((resolve, reject) => {
        provider.once(txResponse.hash, (txReceipt) => {
            console.log(`Complete with ${
                txReceipt.confirmations
            } confirmations`)
            resolve()
        })
    })
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress) // getBalance is a provider method
        console.log(ethers.utils.formatEther((balance)) + " ether")
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log("Withdrawing...")
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const signer = provider.getSigner() // get wallet connected to provider
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const txResponse = await contract.withdraw()
            // await txResponse.wait(1)
            await listenForTxMined(txResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
    }
}
