# How to use

1. Provide [csv file](example.csv) in the following format: 
    `0x2c57E1E3AD53F0b971422696c1470cEB84F83B1B,100`
2. Run `npm install`
3. Edit [.env](.env) file 

`RPC_PORT=8545`
 - RPC port where Oracles node will be running
`HOST=localhost`
 - HOST name of Oracles' node
`FAT_BALANCE=0x0039F22efB07A647557C7C5d17854CFD6D489eF3`
 - address from which you have unlocked your account
`FILENAME_CSV_INVESTORS=example.csv`
 - name of the file with list of contributors and balances to send
`GAS_PRICE=1`
 - gas price for each tx in gwei

4. Run `node distribute.js`

# Errors
All errors will be stored in [errors.csv](errors.csv)

# Success
All succesful txs will be stored in [success.csv](success.csv) with block number and txhash
