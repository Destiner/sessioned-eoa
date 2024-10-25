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
} from 'viem';
import {
  BundlerClient,
  entryPoint07Address,
  sendUserOperation,
} from 'viem/account-abstraction';
import { readContract } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';

import entryPoint070Abi from '@/abi/entryPoint0_7_0.js';
import kernelV3ImplementationAbi from '@/abi/kernelV3Implementation.js';

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

const publicClient = createPublicClient({
  chain: odysseyTestnet,
  transport: http(),
});

function getOpHash(chain: number, entryPoint: Address, op: Op_0_7): Hex | null {
  const hashedInitCode = keccak256(op.initCode);
  const hashedCallData = keccak256(op.callData);
  const hashedPaymasterAndData = keccak256(op.paymasterAndData);
  const packedUserOp = encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'bytes32' },
      { type: 'uint256' },
      { type: 'bytes32' },
      { type: 'bytes32' },
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
    ],
  );
  const encoded = encodeAbiParameters(
    [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
    [keccak256(packedUserOp), entryPoint, BigInt(chain)],
  );
  return keccak256(encoded);
}

async function prepare(
  ownerAddress: Address,
  executions: Execution[],
  overrides?: {
    nonce?: bigint;
    signature?: Hex;
  },
): Promise<Op_0_7> {
  const execMode =
    '0x0100000000000000000000000000000000000000000000000000000000000000';
  const executionCalldata = encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          {
            type: 'address',
            name: 'target',
          },
          {
            type: 'uint256',
            name: 'value',
          },
          {
            type: 'bytes',
            name: 'callData',
          },
        ],
      },
    ],
    [executions],
  );

  const callData = encodeFunctionData({
    abi: kernelV3ImplementationAbi,
    functionName: 'execute',
    args: [execMode, executionCalldata],
  });

  const nonce = await readContract(publicClient, {
    address: entryPoint07Address,
    abi: entryPoint070Abi,
    functionName: 'getNonce',
    args: [ownerAddress, 0n],
  });

  const actualNonce = overrides?.nonce || nonce;

  const op: Op_0_7 = {
    sender: ownerAddress,
    nonce: actualNonce,
    // Should be already initialized
    initCode: '0x',
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
    paymasterAndData: '0x',
    signature: '0x',
  };

  return op;
}

async function submit(
  ownerAddress: Address,
  bundlerClient: BundlerClient,
  op: Op_0_7,
): Promise<Hex> {
  const userOpHash = await sendUserOperation(bundlerClient, {
    entryPointAddress: entryPoint07Address,
    sender: ownerAddress,
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

export { prepare, getOpHash, submit };
export type { Execution };
