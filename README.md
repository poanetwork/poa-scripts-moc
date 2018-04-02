# Scripts for Master of Ceremony

## generateInitialKey

Generates initial key from master of ceremony node.

### How to start:

- `cd ./generateInitialKey`
- `npm i`
- `npm start`

### Config

Config is located in `./config.json`
Example of config:
```
{
  "environment": "live",
  "Ethereum": {
    "live": {
      "rpc": "http://127.0.0.1:8545" // JSON RPC URL of master of ceremony node
    },
    "contracts": {
      "KeysManager": {
        "addr": "0x0e4a78ba651fcf2058e1326e16fc9160553ca467", // address of KeysManager contract
        "abi": [...] //ABI of KeysManager contract
      }
    }
  }
}

```

## distributeTokens

Distributes tokens from csv file in PoA network to pre-sale participants

### How to start:

- `cd ./distributeTokens`
- `npm i`
- `node distributeTokens.js`

### Config

Config is located in `./distributeTokens/.env`
Example of config:
```
RPC_PORT=8545 // master of ceremony's node JSON RPC port 
HOST=localhost // master of ceremony's node host 
FAT_BALANCE=0x0039F22efB07A647557C7C5d17854CFD6D489eF3 // address of master of ceremony
FILENAME_CSV_INVESTORS=example.csv // name of input csv file
GAS_PRICE=1 // gas price of tx in gWei
```
