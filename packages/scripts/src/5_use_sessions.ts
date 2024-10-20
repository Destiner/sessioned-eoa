import {
  Address,
  createClient,
  createWalletClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  Hex,
  http,
  parseEther,
} from "viem";

import erc20Abi from "@/abi/erc20.js";
import tokenStakerAbi from "@/abi/tokenStaker.js";
import wethAbi from "@/abi/weth.js";
import { getOpHash, prepare, submit } from "./utils/send_op.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { readContract, writeContract } from "viem/actions";
import { odysseyTestnet } from "viem/chains";

import entryPoint070Abi from "@/abi/entryPoint0_7_0.js";
import { LibZip } from "solady";
import {
  ENTRY_POINT_0_7_0,
  SMART_SESSION_ADDRESS,
  TOKEN_CONVERTER,
  TOKEN_STAKER_ADDRESS,
  USDC,
  WETH,
  EXP,
} from "./utils/common.js";
import { sleep } from "bun";

const sessionPrivateKey = process.env.SESSION_PRIVATE_KEY as Hex | undefined;
if (!sessionPrivateKey) {
  throw new Error("SPONSOR_PRIVATE_KEY is required");
}
const sessionOwner = privateKeyToAccount(sessionPrivateKey);

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as Hex | undefined;
if (!ownerPrivateKey) {
  throw new Error("OWNER_PRIVATE_KEY is required");
}
const owner = privateKeyToAccount(ownerPrivateKey);

const client = createClient({
  chain: odysseyTestnet,
  transport: http(),
});

const anySignerOpHash = await sendAnySignerOp();
console.log("Any Signer Op Hash:", anySignerOpHash);
const tokenSignerOpHash = await sendTokenSignerOp();
console.log("Token Signer Op Hash:", tokenSignerOpHash);

async function sendAnySignerOp(): Promise<Hex> {
  const op = await prepare([
    {
      target: WETH,
      value: 1n,
      callData: encodeFunctionData({
        abi: wethAbi,
        functionName: "deposit",
      }),
    },
  ]);
  const nonceKey = encodeValidatorNonce(SMART_SESSION_ADDRESS);
  const nonce = await readContract(client, {
    address: ENTRY_POINT_0_7_0,
    abi: entryPoint070Abi,
    functionName: "getNonce",
    args: [owner.address, nonceKey],
  });
  op.nonce = nonce;
  const hash = getOpHash(odysseyTestnet.id, ENTRY_POINT_0_7_0, op);
  if (!hash) {
    throw new Error("Failed to get hash");
  }
  const randomAccount = privateKeyToAccount(generatePrivateKey());
  const sessionOwnerSignature = await randomAccount.signMessage({
    message: {
      raw: hash,
    },
  });
  const permissionId =
    "0xb3835f0d5bba72de2b0e64e8e2bb72944c103c2a5a2d2f9a48975ae991643796";
  op.signature = encodeSessionSignature(permissionId, sessionOwnerSignature);
  const opHash = await submit(op);
  return opHash;
}

async function sendTokenSignerOp(): Promise<Hex> {
  const sessionClient = createWalletClient({
    account: sessionOwner,
    chain: odysseyTestnet,
    transport: http(),
  });

  // Mint EXP
  console.log("Minting EXP…");
  await writeContract(sessionClient, {
    address: EXP,
    abi: [
      {
        type: "function",
        name: "mint",
        inputs: [
          {
            type: "address",
            name: "to",
          },
          {
            type: "uint256",
            name: "amount",
          },
        ],
        outputs: [],
      },
    ],
    functionName: "mint",
    args: [sessionOwner.address, parseEther("10")],
  });

  await sleep(10 * 1000);

  // Approve EXP for TokenStaker
  console.log("Approving EXP for TokenStaker…");
  await writeContract(sessionClient, {
    address: EXP,
    abi: erc20Abi,
    functionName: "approve",
    args: [TOKEN_STAKER_ADDRESS, parseEther("10")],
  });

  await sleep(10 * 1000);

  // Lock EXP for an account
  console.log("Locking EXP for an account…");
  await writeContract(sessionClient, {
    address: TOKEN_STAKER_ADDRESS,
    abi: tokenStakerAbi,
    functionName: "stakeErc20",
    args: [owner.address, EXP, parseEther("10")],
  });

  await sleep(10 * 1000);

  console.log("Approving WETH for TokenConverter…");
  const op = await prepare([
    {
      target: WETH,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [TOKEN_CONVERTER, 1n],
      }),
    },
  ]);
  const nonceKey = encodeValidatorNonce(SMART_SESSION_ADDRESS);
  const nonce = await readContract(client, {
    address: ENTRY_POINT_0_7_0,
    abi: entryPoint070Abi,
    functionName: "getNonce",
    args: [owner.address, nonceKey],
  });
  op.nonce = nonce;
  const hash = getOpHash(odysseyTestnet.id, ENTRY_POINT_0_7_0, op);
  if (!hash) {
    throw new Error("Failed to get hash");
  }
  const sessionOwnerSignature = await sessionOwner.signMessage({
    message: {
      raw: hash,
    },
  });
  const permissionId =
    "0xb6d0d36e150601d7d3a465cc34d0031dfc09501d68e37097ec07340cf476fdbd";
  op.signature = encodeSessionSignature(permissionId, sessionOwnerSignature);
  const opHash = await submit(op);
  return opHash;
}

function encodeSessionSignature(permissionId: Hex, signature: Hex): Hex {
  return encodePacked(
    ["bytes1", "bytes32", "bytes"],
    [
      "0x00",
      permissionId,
      LibZip.flzCompress(
        encodeAbiParameters(
          [
            {
              type: "bytes",
            },
          ],
          [signature]
        )
      ) as Hex,
    ]
  );
}

function encodeValidatorNonce(validator: Address): bigint {
  const hex = `0x0001${validator.slice(2)}0000`;
  return BigInt(hex);
}
