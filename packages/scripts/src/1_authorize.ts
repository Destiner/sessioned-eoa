import { concat, createClient, Hex, http, parseGwei, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { writeContract } from "viem/actions";
import { odysseyTestnet } from "viem/chains";

import kernelV3ImplementationAbi from "@/abi/kernelV3Implementation.js";
import { signAuthorization } from "viem/experimental";
import {
  KERNEL_V3_1_IMPLEMENTATION,
  MULTI_CHAIN_VALIDATOR,
} from "./utils/common.js";

const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY as Hex | undefined;
if (!sponsorPrivateKey) {
  throw new Error("SPONSOR_PRIVATE_KEY is required");
}
const sponsorAccount = privateKeyToAccount(sponsorPrivateKey);
console.log("Sponsor Address:", sponsorAccount.address);

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as Hex | undefined;
if (!ownerPrivateKey) {
  throw new Error("OWNER_PRIVATE_KEY is required");
}
const account = privateKeyToAccount(ownerPrivateKey);

const client = createClient({
  chain: odysseyTestnet,
  transport: http(),
});

const authorization = await signAuthorization(client, {
  account,
  contractAddress: KERNEL_V3_1_IMPLEMENTATION,
  delegate: sponsorAccount,
});

const txHash = await writeContract(client, {
  address: account.address,
  abi: kernelV3ImplementationAbi,
  functionName: "initialize",
  args: [
    concat(["0x01", MULTI_CHAIN_VALIDATOR]),
    zeroAddress,
    account.address,
    "0x",
    [],
  ],
  account: sponsorAccount,
  authorizationList: [authorization],
  // maxPriorityFeePerGas: parseGwei("1.5"),
  // maxFeePerGas: parseGwei("2"),
});

console.log("Transaction Hash:", txHash);
