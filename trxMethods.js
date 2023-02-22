const TronWeb = require("tronweb");

let network = "mainnet";
const sunSwapFactory = "TB2LM4iegvhPJGWn9qizeefkPMm7bqqaMs";
const factoryV2address = "TKWJdrQkqHisa1X8HUdHEfREvTzw4pMAaY";
const routerV2 = "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";

const privateKey = ""; //input private key

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
    const broadcastTx = await tronWeb.trx.sendRawTransaction(signedTx);
    return broadcastTx;
  } catch (error) {
    console.error(error);
  }
}

// swapTokenToTrx("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 1000000, privateKey, "TFobcKZ2s11ctzQH6CPUpyWH9zUqJsGQum")
