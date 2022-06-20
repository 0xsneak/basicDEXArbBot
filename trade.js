const fs = require("fs");
var Web3 = require('web3');
var Contract = require('web3-eth-contract');
const web3 = new Web3("https://rpc.fuse.io"); //RPC of chain you are using
const BigNumber = require('bignumber.js');

var address = "ADDRESS OF DEPLOYED ARB CONTRACT"; //Modified Arb smart contract address

var abi = require('./../config/abiFUSE.json'); //ABI of deployed contract

var privateKey = "OWNER WALLET PRIVATE KEY HERE"; // privateKey of arb contract OWNER wallet

//Web3 to connect to metamask provider chain

const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
const contract = new web3.eth.Contract(abi,address, {
    from: wallet.address,
});

web3.eth.accounts.wallet.add(privateKey); //adds wallet using private key imported earlier
const account = web3.eth.accounts.wallet[0].address;

let profitFound = 0; //intitiate at 0

let goodCount = 0;

let config = require('./../config/fuse.json'); //good routes as well as all available route information stored in the config file

let defaultSize = new BigNumber(1000000000000000000); //default 1 * 10^18 = 1 WFUSE

let balance;

//advised to use this function rather than searching for routes to save time
function useGoodRoutes(){
  const targetRoute = {};
  const route = config.routes[goodCount];
  goodCount += 1;
  if (goodCount >= config.routes.length){
    goodCount = 0;
  } 
  targetRoute.router1 = route[0];
  targetRoute.router2 = route[1];
  targetRoute.token1 = route[2];
  targetRoute.token2 = route[3];
  return targetRoute;
}

//searches for routes by randomly pairing tokens and routers
const searchForRoutes = () => {
    const targetRoute = {};
    targetRoute.router1 = config.routers[Math.floor(Math.random()*config.routers.length)].address;
    targetRoute.router2 = config.routers[Math.floor(Math.random()*config.routers.length)].address;
    targetRoute.token1 = config.baseAssets[Math.floor(Math.random()*config.baseAssets.length)].address;
    targetRoute.token2 = config.tokens[Math.floor(Math.random()*config.tokens.length)].address;
    return targetRoute;
  }


//main loop
async function go(){
//uses FULL balance of WFUSE, or defaults to defaultSize if errors
    while(profitFound == 0){
        balance = await contract.methods.getBalance("BASE ASSET TOKEN ADDRESS").call().catch(() => {
            console.log("error tradesize, returning default");
            return defaultSize;
        });
        await EstimateTrade(useGoodRoutes());
    }
}


go();
//recoverTokens("BASE ASSET TOKEN ADDRESS"); //use this or functions below to pull tokens from testing in prod

async function recoverTokens(token_address){
    await contract.methods.recoverTokens(token_address).send({
        from: account,
        gasPrice: 300000000003,
        gasLimit: 300000
    }).catch(()=>{
        profitFound = 0;
    });
    console.log("Tokens recovered!");
}

async function recoverEth(){
    await contract.methods.recoverEth().send({
        from: account,
        gasPrice: 30000000003,
        gasLimit: 300000
    }).catch(()=>{
        profitFound = 0;
    });
}

async function EstimateTrade(targetRoute) {
    await GetAmtBack(targetRoute, balance);
    console.log(targetRoute);
}

async function GetBalance(targetRoute){
    let tradeSize = contract.methods.getBalance(targetRoute.token1).call()
    .catch(() => {
        console.log("error tradesize, returning default");
        return defaultSize;
    });
    //console.log(tradeSize);
    return tradeSize;
}

//The MAIN bulk of the logic is here. Using BigNumber.js to deal with overflow from huge wei values. Repeatedly estimates the trade until it finds one that is profitable
//sets profitFound to 1 to kill loop and sends TX
//accounts for gas cost set on line 121
async function GetAmtBack(targetRoute, tradeSize) {
    let amtBack = new BigNumber(await contract.methods.estimateDualDexTrade(targetRoute.router1, targetRoute.router2, targetRoute.token1, targetRoute.token2, tradeSize).call()
        .catch(() => {
            console.log("Returned 0 , searching...");
            return 0;
        }));
        tSize = new BigNumber(tradeSize)
        totalCost = new BigNumber(tSize.plus(GAS COST AS WEI));
        if(amtBack.gt(totalCost)){
            profitFound = 1;
            await contract.methods.dualDexTrade(targetRoute.router1, targetRoute.router2, targetRoute.token1, targetRoute.token2, tradeSize).send({
                from: account,
                gasPrice: 3000000003,
                gasLimit: 300000
            }).catch(()=>{
                profitFound = 0;
            });
            console.log('\x1b[32m' , "Profitable trade found!");
            console.log('\x1b[32m', ""+totalCost.toFixed()+" - trade size");
            console.log('\x1b[32m', ""+amtBack.toFixed()+" - estimated return");
            fs.appendFile(`C:/Users/mwalk/Documents/dexbot/data/fuseRouteLog.txt`, `["${targetRoute.router1}","${targetRoute.router2}","${targetRoute.token1}","${targetRoute.token2}"],`+"\n", function (err) {});
        }else{
            console.log("Not profitable! :(");
            console.log(totalCost.toFixed()+" - trade size");
        }
        profitFound = 0;
    console.log(amtBack.toFixed()+" - estimated amount back");
    return amtBack;

}

