import {
  Address,
  concat,
  createPublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  Hex,
  http,
  keccak256,
  padHex,
} from "viem";
import { odysseyTestnet } from "viem/chains";
import { privateKeyToAccount, sign } from "viem/accounts";
import { readContract } from "viem/actions";

import entryPoint070Abi from "@/abi/entryPoint0_7_0.js";
import kernelV3ImplementationAbi from "@/abi/kernelV3Implementation.js";
import { ENTRY_POINT_0_7_0 } from "./common.js";
import {
  createBundlerClient,
  sendUserOperation,
} from "viem/account-abstraction";

interface Op_0_7 {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex;
  preVerificationGas: bigint;
  gasFees: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

interface Execution {
  target: Address;
  value: bigint;
  callData: Hex;
}

// Fix: make it dynamic
const callGasLimit = 1000000n;
const verificationGasLimit = 2000000n;
const preVerificationGas = 100000n;
const maxPriorityFeePerGas = 3500000000n;
const maxFeePerGas = 4000000000n;

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as Hex | undefined;
if (!ownerPrivateKey) {
  throw new Error("OWNER_PRIVATE_KEY is required");
}
const owner = privateKeyToAccount(ownerPrivateKey);

const bundlerRpc = process.env.BUNDLER_RPC;
if (!bundlerRpc) {
  throw new Error("BUNDLER_RPC is required");
}

const publicClient = createPublicClient({
  chain: odysseyTestnet,
  transport: http(),
});
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(bundlerRpc),
});

function getOpHash(chain: number, entryPoint: Address, op: Op_0_7): Hex | null {
  const hashedInitCode = keccak256(op.initCode);
  const hashedCallData = keccak256(op.callData);
  const hashedPaymasterAndData = keccak256(op.paymasterAndData);
  const packedUserOp = encodeAbiParameters(
    [
      { type: "address" },
      { type: "uint256" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "bytes32" },
      { type: "uint256" },
      { type: "bytes32" },
      { type: "bytes32" },
    ],
    [
      op.sender,
      op.nonce,
      hashedInitCode,
      hashedCallData,
      op.accountGasLimits,
      op.preVerificationGas,
      op.gasFees,
      hashedPaymasterAndData,
    ]
  );
  const encoded = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "address" }, { type: "uint256" }],
    [keccak256(packedUserOp), entryPoint, BigInt(chain)]
  );
  return keccak256(encoded);
}

async function prepare(
  executions: Execution[],
  overrides?: {
    nonce?: bigint;
    signature?: Hex;
  }
): Promise<Op_0_7> {
  const execMode =
    "0x0100000000000000000000000000000000000000000000000000000000000000";
  const executionCalldata = encodeAbiParameters(
    [
      {
        type: "tuple[]",
        components: [
          {
            type: "address",
            name: "target",
          },
          {
            type: "uint256",
            name: "value",
          },
          {
            type: "bytes",
            name: "callData",
          },
        ],
      },
    ],
    [executions]
  );

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: "execute",
    args: [execMode, executionCalldata],
  });

  const nonce = await readContract(publicClient, {
    address: ENTRY_POINT_0_7_0,
    abi: entryPoint070Abi,
    functionName: "getNonce",
    args: [owner.address, 0n],
  });

  const actualNonce = overrides?.nonce || nonce;

  const op: Op_0_7 = {
    sender: owner.address,
    nonce: actualNonce,
    // Should be already initialized
    initCode: "0x",
    callData,
    accountGasLimits: concat([
      padHex(verificationGasLimit.toString(16) as Hex, { size: 16 }),
      padHex(callGasLimit.toString(16) as Hex, { size: 16 }),
    ]),
    preVerificationGas,
    gasFees: concat([
      padHex(maxPriorityFeePerGas.toString(16) as Hex, { size: 16 }),
      padHex(maxFeePerGas.toString(16) as Hex, { size: 16 }),
    ]),
    paymasterAndData: "0x",
    signature: "0x",
  };

  return op;
}

async function submit(op: Op_0_7): Promise<Hex> {
  const userOpHash = await sendUserOperation(bundlerClient, {
    entryPointAddress: ENTRY_POINT_0_7_0,
    sender: owner.address,
    nonce: op.nonce,
    callData: op.callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxPriorityFeePerGas,
    maxFeePerGas,
    signature: op.signature,
  });

  return userOpHash;
}

async function send(
  executions: Execution[],
  overrides?: {
    nonce?: bigint;
    signature?: Hex;
  }
): Promise<Hex> {
  const execMode =
    "0x0100000000000000000000000000000000000000000000000000000000000000";
  const executionCalldata = encodeAbiParameters(
    [
      {
        type: "tuple[]",
        components: [
          {
            type: "address",
            name: "target",
          },
          {
            type: "uint256",
            name: "value",
          },
          {
            type: "bytes",
            name: "callData",
          },
        ],
      },
    ],
    [executions]
  );

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: "execute",
    args: [execMode, executionCalldata],
  });

  const nonce = await readContract(publicClient, {
    address: ENTRY_POINT_0_7_0,
    abi: entryPoint070Abi,
    functionName: "getNonce",
    args: [owner.address, 0n],
  });

  const actualNonce = overrides?.nonce || nonce;

  const op: Op_0_7 = {
    sender: owner.address,
    nonce: actualNonce,
    // Should be already initialized
    initCode: "0x",
    callData,
    accountGasLimits: concat([
      padHex(verificationGasLimit.toString(16) as Hex, { size: 16 }),
      padHex(callGasLimit.toString(16) as Hex, { size: 16 }),
    ]),
    preVerificationGas,
    gasFees: concat([
      padHex(maxPriorityFeePerGas.toString(16) as Hex, { size: 16 }),
      padHex(maxFeePerGas.toString(16) as Hex, { size: 16 }),
    ]),
    paymasterAndData: "0x",
    signature: "0x",
  };

  const opHash = getOpHash(odysseyTestnet.id, ENTRY_POINT_0_7_0, op);
  if (!opHash) {
    console.error("Failed to get op hash");
    process.exit(1);
  }
  if (!ownerPrivateKey) {
    console.error("OWNER_PRIVATE_KEY is required");
    process.exit(1);
  }
  const signature = await sign({
    hash: opHash,
    privateKey: ownerPrivateKey,
  });

  const signatureHex = concat([
    signature.r,
    signature.s,
    `0x${(signature.v || 0n).toString(16)}`,
  ]) as Hex;

  const actualSignature = overrides?.signature || signatureHex;

  const userOpHash = await sendUserOperation(bundlerClient, {
    entryPointAddress: ENTRY_POINT_0_7_0,
    sender: owner.address,
    nonce,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxPriorityFeePerGas,
    maxFeePerGas,
    signature: actualSignature,
  });

  return userOpHash;
}

export { prepare, send, getOpHash, submit };
