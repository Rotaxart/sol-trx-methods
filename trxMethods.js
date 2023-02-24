// const TronWeb = require("tronweb");
import TronWeb from "tronweb";

let network = "mainnet";
const sunSwapFactory = "TB2LM4iegvhPJGWn9qizeefkPMm7bqqaMs";
const factoryV2address = "TKWJdrQkqHisa1X8HUdHEfREvTzw4pMAaY";
const routerV2 = "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";

const APPROVE_AVG_ENERGY = 16800;
const TRC20_TRANSFER_AVG_ENERGY = 65000;
const SWAP_TRX_TO_TOKEN_AVG_ENERGY = 122885;
const SWAP_TOKEN_TO_TRX_AVG_ENERGY = 118345;
const SWAP_TOKEN_TO_TOKEN_AVG_ENERGY = 92000;

const privateKey =
  ""; //input private key

const tronWeb =
  network === "testnet"
    ? new TronWeb({
        fullNode: "https://api.shasta.trongrid.io",
        solidityNode: "https://api.shasta.trongrid.io",
        fullHost: "https://api.shasta.trongrid.io",
        privateKey: privateKey,
      })
    : new TronWeb({
        fullNode: "https://api.trongrid.io",
        solidityNode: "https://api.trongrid.io",
        fullHost: "https://api.trongrid.io",
        privateKey: privateKey,
      });

async function sendTrx(to, amount, privateKey) {
  try {
    return await tronWeb.trx.sendTransaction(to, amount, privateKey);
  } catch (error) {
    console.error(error);
  }
}

async function sendTRC20Token(
  fromAddress, //string
  toAddress, //string
  amount, //int
  privateKey, //string
  CONTRACT //string trc20contract address
) {
  let url = null;
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };
  const tx = await tronWeb.transactionBuilder.triggerSmartContract(
    CONTRACT,
    "transfer(address,uint256)",
    options,
    [
      {
        type: "address",
        value: toAddress,
      },
      {
        type: "uint256",
        value: amount * 1000000,
      },
    ],
    tronWeb.address.toHex(fromAddress)
  );
  const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
  const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
  return broadcastTx;
}

async function getAvailablePairs(
  trc20address //string
) {
  try {
    const res = await fetch(
      "https://openapi.sun.io/v2/allpairs?" +
        new URLSearchParams({
          page_size: 100,
          page_num: 0,
          token_address: trc20address,
          ver: 3,
        }),
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

// getAvailablePairs("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")

async function getExchange(
  token_address //string trc20contract address
) {
  try {
    let contract = await tronWeb.contract().at(sunSwapFactory);
    const call = await contract.getExchange(token_address).call();
    return call;
  } catch (error) {
    console.error(error);
  }
}

async function getPairV2(
  token_address1, //string trc20contract address
  token_address2 //string trc20contract address
) {
  try {
    let contract = await tronWeb.contract().at(factoryV2address);
    const call = await contract.getPair(token_address1, token_address2).call();
    return call;
  } catch (error) {
    console.error(error);
  }
}
// getPairV2("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn");

async function swapTrxToToken(
  token_address, //string trc20contract address
  amt, //int
  privateKey, //string
  fromAddress //string sender address
) {
  const options = {
    feeLimit: 1000000000,
    callValue: amt,
  };
  try {
    const address = await getExchange(token_address);
    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      address,
      "trxToTokenSwapInput(uint256,uint256)",
      options,
      [
        { type: "uint256", value: "1" },
        { type: "uint256", value: (Date.now() + 60000).toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTrxToToken("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 10000000, privateKey, "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum");

async function trc20approve(
  tokenAddress, //string trc20
  amt, //int
  privateKey, //string
  fromAddress, //string sender address
  spenderAddress //string
) {
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };
  try {
    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      tokenAddress,
      "approve(address,uint256)",
      options,
      [
        { type: "address", value: spenderAddress },
        { type: "uint256", value: amt.toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

async function swapTokenToTrx(
  token_address, //string
  amt, //int
  privateKey, //string
  fromAddress //string
) {
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };
  try {
    const address = await getExchange(token_address);
    const approve = await trc20approve(
      token_address,
      amt,
      privateKey,
      fromAddress,
      address
    );

    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      address,
      "tokenToTrxSwapInput(uint256,uint256,uint256)",
      options,
      [
        { type: "uint256", value: amt.toString() },
        { type: "uint256", value: "100" },
        { type: "uint256", value: (Date.now() + 60000).toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTokenToTrx("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 1000000, privateKey, "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")

async function swapTokenToToken(
  token1_address, //string
  token2_address, //string
  amt, //int
  privateKey, //string
  fromAddress, //string
  exchangeAddress //string exchange token1 address (not getExchange(token1))
) {
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };

  try {
    const approve = await trc20approve(
      token1_address,
      amt,
      privateKey,
      fromAddress,
      exchangeAddress
    );
    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      exchangeAddress,
      "tokenToTokenSwapInput(uint256,uint256,uint256,uint256,address)",
      options,
      [
        { type: "uint256", value: amt.toString() },
        { type: "uint256", value: "1" },
        { type: "uint256", value: "1" },
        { type: "uint256", value: (Date.now() + 60000).toString() },
        { type: "address", value: token2_address },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTokenToToken(
//   "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
//   "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn",
//   1000000,
//   privateKey,
//   "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum",
//   "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE"
// );

async function swapTokenToTokenV2(
  token1_address, //string
  token2_address, //string
  amt, //int
  privateKey, //string
  fromAddress //string
) {
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };

  try {
    // const exchangeAddress = await getPairV2(token1_address, token2_address)
    const approve = await trc20approve(
      token1_address,
      amt,
      privateKey,
      fromAddress,
      routerV2
    );
    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      routerV2,
      "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
      options,
      [
        { type: "uint256", value: amt.toString() },
        { type: "uint256", value: "1" },
        { type: "address[]", value: [token1_address, token2_address] },
        { type: "address", value: fromAddress },
        { type: "uint256", value: (Date.now() + 60000).toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTokenToTokenV2(
//   "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
//   "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn",
//   1000000,
//   privateKey,
//   "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum"
// );

async function swapTrxToTokenV2(
  token_address, //string trc20contract address
  amt, //int
  privateKey, //string
  fromAddress //string sender address
) {
  const options = {
    feeLimit: 1000000000,
    callValue: amt,
  };
  try {
    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      routerV2,
      "swapExactETHForTokens(uint256,address[],address,uint256)",
      options,
      [
        { type: "uint256", value: "1" },
        { type: "address[]", value: [WTRX, token_address] },
        { type: "address", value: fromAddress },
        { type: "uint256", value: (Date.now() + 60000).toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTrxToTokenV2("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 10000000, privateKey, "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum");

async function swapTokenToTrxV2(
  token_address, //string
  amt, //int
  privateKey, //string
  fromAddress //string
) {
  const options = {
    feeLimit: 1000000000,
    callValue: 0,
  };
  try {
    const approve = await trc20approve(
      token_address,
      amt,
      privateKey,
      fromAddress,
      routerV2
    );

    const tx = await tronWeb.transactionBuilder.triggerSmartContract(
      routerV2,
      "swapTokensForExactETH(uint256,uint256,address[],address,uint256)",
      options,
      [
        { type: "uint256", value: amt.toString() },
        { type: "uint256", value: "1" },
        { type: "address[]", value: [token_address, WTRX] },
        { type: "address", value: fromAddress },
        { type: "uint256", value: (Date.now() + 60000).toString() },
      ],
      tronWeb.address.toHex(fromAddress)
    );
    const signedTx = await tronWeb.trx.sign(tx.transaction, privateKey);
    console.log({
      tx: signedTx,
      cont: signedTx.raw_data.contract[0].parameter,
    });
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTokenToTrxV2("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 1000000, privateKey, "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")

async function getChainData() {
  const chainData = await tronWeb.trx.getChainParameters();
  return chainData;
}

// getChainData()

async function getEstimateGas(
  method // string: tokenTransfer, swapTrxToToken, swapTokenToTrx, swapTokenToToken
  ) {
  try {
    const chainData = await getChainData();
    const energyFee = chainData.find(
      (data) => data.key === "getEnergyFee"
    ).value;
    const transactionFee = chainData.find(
      (data) => data.key === "getTransactionFee"
    ).value;

    switch (method) {
      case "tokenTransfer":
        const options = {
          feeLimit: 1000000000,
          callValue: 0,
        };
        const txTrc20 = await tronWeb.transactionBuilder.triggerSmartContract(
          "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          "transfer(address,uint256)",
          options,
          [
            {
              type: "address",
              value: "TKB6L3Ng9ntJNPdPM44ezQVhjWxQpm6fXx",
            },
            {
              type: "uint256",
              value: 1000000,
            },
          ],
          tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
        );
        const bandwidth = txTrc20.transaction.raw_data_hex.length;
        const trxFee =
          TRC20_TRANSFER_AVG_ENERGY * energyFee + bandwidth * transactionFee;
        console.log(trxFee);
        return trxFee;

      case "swapTrxToToken":
        const txTrxtoTrc =
          await tronWeb.transactionBuilder.triggerSmartContract(
            routerV2,
            "swapExactETHForTokens(uint256,address[],address,uint256)",
            {
              feeLimit: 1000000000,
              callValue: 1000000,
            },
            [
              { type: "uint256", value: "1" },
              {
                type: "address[]",
                value: [WTRX, "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"],
              },
              { type: "address", value: "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum" },
              { type: "uint256", value: 1000000 },
            ],
            tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
          );
        const bandwidth2 = txTrxtoTrc.transaction.raw_data_hex.length;
        const trxFee2 =
          SWAP_TRX_TO_TOKEN_AVG_ENERGY * energyFee +
          bandwidth2 * transactionFee;
        console.log(bandwidth2, trxFee2);
        return trxFee2;

      case "swapTokenToTrx":
        const txApprove = await tronWeb.transactionBuilder.triggerSmartContract(
          "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
          "approve(address,uint256)",
          {
            feeLimit: 1000000000,
            callValue: 0,
          },
          [
            { type: "address", value: "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum" },
            { type: "uint256", value: 1000000 },
          ],
          tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
        );

        const txTrcToTrx =
          await tronWeb.transactionBuilder.triggerSmartContract(
            routerV2,
            "swapTokensForExactETH(uint256,uint256,address[],address,uint256)",
            {
              feeLimit: 1000000000,
              callValue: 0,
            },
            [
              { type: "uint256", value: 1000000 },
              { type: "uint256", value: "1" },
              {
                type: "address[]",
                value: ["TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", WTRX],
              },
              { type: "address", value: "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum" },
              { type: "uint256", value: (Date.now() + 60000).toString() },
            ],
            tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
          );

        const bandwidth3 =
          txApprove.transaction.raw_data_hex.length +
          txTrcToTrx.transaction.raw_data_hex.length;
        const txFee3 =
          (APPROVE_AVG_ENERGY + SWAP_TOKEN_TO_TRX_AVG_ENERGY) * energyFee +
          bandwidth3 * transactionFee;
        console.log(txFee3);
        return txFee3;

      case "swapTokenToToken":
        const txApprove2 =
          await tronWeb.transactionBuilder.triggerSmartContract(
            "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
            "approve(address,uint256)",
            {
              feeLimit: 1000000000,
              callValue: 0,
            },
            [
              { type: "address", value: "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum" },
              { type: "uint256", value: 1000000 },
            ],
            tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
          );

        const txTrcToTrc =
          await tronWeb.transactionBuilder.triggerSmartContract(
            routerV2,
            "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)",
            {
              feeLimit: 1000000000,
              callValue: 0,
            },
            [
              { type: "uint256", value: 1000000 },
              { type: "uint256", value: "1" },
              {
                type: "address[]",
                value: [
                  "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
                  "TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn",
                ],
              },
              { type: "address", value: "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum" },
              { type: "uint256", value: (Date.now() + 60000).toString() },
            ],
            tronWeb.address.toHex("TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
          );

        const bandwidth4 =
          txApprove2.transaction.raw_data_hex.length +
          txTrcToTrc.transaction.raw_data_hex.length;
        const txFee4 =
          (APPROVE_AVG_ENERGY + SWAP_TOKEN_TO_TOKEN_AVG_ENERGY) * energyFee +
          bandwidth4 * transactionFee;
        console.log(txFee4);
        return txFee4;
    }
  } catch (error) {
    console.error(error);
  }
}

getEstimateGas("swapTokenToToken");
