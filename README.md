# Basic DEX Arb Bot

The bot takes routes (or generates routes from) the token and router addresses found in the config JSON file.

It then checks to see if trading those assets will turn a profit and, if so, calls the function to swap them.

It's only compatible with UniV2 DEXs (and therefore all forks of UniV2) and is in a very basic state.

# Setup

Deploy the smart contract, update the config files, ABI file and trade.js file with relevant addresses.

Supply the contract with the BASE token you wish to swap (advised to use the wrapped version of the chains native token, in this example WONE, for Harmony)

Ensure owner wallet has enough native token for gas.

# Issues

Getting frontrun is an issue, I suggest using less popular chains to do this on.

It doesn't scale well at all.

# Thanks

Thanks to James Bachini for his tutorial and guidance on this subject.
