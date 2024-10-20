import {
  concat,
  encodeFunctionData,
  Hex,
  padHex,
  size,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { send as sendOp } from "./utils/send_op.js";

import kernelV3ImplementationAbi from "@/abi/kernelV3Implementation.js";
import { SMART_SESSION_ADDRESS } from "./utils/common.js";

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as Hex | undefined;
if (!ownerPrivateKey) {
  throw new Error("OWNER_PRIVATE_KEY is required");
}
const account = privateKeyToAccount(ownerPrivateKey);

const moduleTypeValidator = 1n;

const hook = zeroAddress;
const validationData = "0x";
const validationLength = padHex(size(validationData).toString(16) as Hex);
console.log("Validation Length:", validationLength);
const validationOffset = padHex("0x60");
const hookLength = padHex("0x0");
const hookOffset = padHex(
  (
    BigInt(validationOffset) +
    BigInt(validationLength) +
    BigInt("0x20")
  ).toString(16) as Hex
);
const selectorLength = padHex("0x0");
const selectorOffset = padHex(
  (BigInt(hookOffset) + BigInt("0x20")).toString(16) as Hex
);

const initData = concat([
  hook,
  validationOffset,
  hookOffset,
  selectorOffset,
  validationLength,
  validationData,
  hookLength,
  selectorLength,
]);
console.log("Init Data:", initData);

const callData = encodeFunctionData({
  abi: kernelV3ImplementationAbi,
  functionName: "installModule",
  args: [moduleTypeValidator, SMART_SESSION_ADDRESS, initData],
});

const hash = await sendOp([
  {
    target: account.address,
    callData,
    value: 0n,
  },
]);
console.log("Transaction Hash:", hash);
