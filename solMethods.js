// const web3 = require("@solana/web3.js");
import * as web3 from "@solana/web3.js"
// const bs58 = require("bs58");
import base58 from "bs58";
// const splToken = require("@solana/spl-token");
import * as splToken from "@solana/spl-token";



const privateKey =
  "";
const publicKey = new web3.PublicKey(
  "ABmR5nuWyyMsxdzpKzc1kyhBwL8UBwk2CgTB42oHLCTh"
);
const publicKey2 = new web3.PublicKey(
  "BpU1rNZu55z7ZJ3PdHjYkDZTtZsAK3rMEy8nNduJeczA"
);

const connection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"))

async function sendSol(amt, recieverAddress, privateKey) {
  const keypair = web3.Keypair.fromSecretKey(base58
.decode(privateKey));
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new web3.PublicKey(recieverAddress),
      lamports: web3.LAMPORTS_PER_SOL * amt,
    })
  );
  const tx = await web3.sendAndConfirmTransaction(connection, transaction, [
    keypair,
  ]);
  console.log(tx);
  return tx;
}

// sendSol(0.1, publicKey2, privateKey)


async function sendSplToken(amt, recieverAddress, privateKey, tokenAddress) {
  const tokenPubKey = new web3.PublicKey(tokenAddress);
  const mint = new web3.PublicKey("Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi")
  const keypair = web3.Keypair.fromSecretKey(base58.decode(privateKey));
  const recieverPubKey = new web3.PublicKey(recieverAddress);
  const {TOKEN_PROGRAM_ID} = splToken
// console.log(keypair)
console.log(keypair,
    tokenPubKey,
    recieverPubKey)
  const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    tokenPubKey,
    recieverPubKey
  );
  console.log(fromTokenAccount)
  const senderAccount = await connection.getAccountInfo(fromTokenAccount.address);
  console.log(senderAccount)
  const associatedDestinationTokenAddr = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    tokenPubKey,
    recieverPubKey
  );
//   console.log(associatedDestinationTokenAddr)

  const receiverAccount = await connection.getAccountInfo(associatedDestinationTokenAddr.address);
//   console.log(receiverAccount)


const signature = await splToken.transfer(
    connection,
    keypair,
    fromTokenAccount.address,
    associatedDestinationTokenAddr.address,
    keypair.publicKey,
    amt * 1000000
);

console.log(signature)

//   const instructions = [];  
//   instructions.push(
//     splToken.createTransferInstruction(
//       fromTokenAccount.address,
//       associatedDestinationTokenAddr.address,
//       keypair.publicKey,
//       amt * 1000000,
//       [],
//       TOKEN_PROGRAM_ID
//     )
//   );


//   const transaction = new web3.Transaction().add(...instructions);


//   const tx = await web3.sendAndConfirmTransaction(connection, transaction, [
//     keypair,
//   ]);

// console.log(tx)
//   transaction.feePayer = keypair.publicKey;


//   transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  
//   const transactionSignature = await connection.sendRawTransaction(
//     transaction.serialize(),
//     { skipPreflight: true }
//   );
    
//   await connection.confirmTransaction(transactionSignature);

}

sendSplToken(0.1, publicKey2, privateKey, "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")