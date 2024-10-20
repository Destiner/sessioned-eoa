import {
  encodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  Hex,
  parseEther,
  toFunctionSelector,
  zeroHash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { send } from "./utils/send_op.js";

import smartSessionModuleAbi from "@/abi/smartSessionModule.js";
import erc20Abi from "@/abi/erc20.js";
import tokenConverterAbi from "@/abi/tokenConverter.js";
import wethAbi from "@/abi/weth.js";
import {
  ANY_SIGNER_ADDRESS,
  EXP,
  SMART_SESSION_ADDRESS,
  TOKEN_CONVERTER,
  TOKEN_SIGNER_ADDRESS,
  USDC,
  WETH,
  YES_POLICY_ADDRESS,
} from "./utils/common.js";

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY as Hex | undefined;
if (!ownerPrivateKey) {
  throw new Error("OWNER_PRIVATE_KEY is required");
}
const account = privateKeyToAccount(ownerPrivateKey);

const sessionPrivateKey = process.env.SESSION_PRIVATE_KEY as Hex | undefined;
if (!sessionPrivateKey) {
  throw new Error("SPONSOR_PRIVATE_KEY is required");
}

const approvalSelector = toFunctionSelector(
  getAbiItem({
    abi: erc20Abi,
    name: "approve",
  })
);
const depositSelector = toFunctionSelector(
  getAbiItem({
    abi: wethAbi,
    name: "deposit",
  })
);
const withdrawSelector = toFunctionSelector(
  getAbiItem({
    abi: wethAbi,
    name: "withdraw",
  })
);
const convertSelector = toFunctionSelector(
  getAbiItem({
    abi: tokenConverterAbi,
    name: "convert",
  })
);

const txHash = await send([
  {
    target: SMART_SESSION_ADDRESS,
    value: BigInt(0),
    callData: encodeFunctionData({
      abi: smartSessionModuleAbi,
      functionName: "enableSessions",
      args: [
        [
          {
            sessionValidator: ANY_SIGNER_ADDRESS,
            sessionValidatorInitData: "0x",
            salt: zeroHash,
            userOpPolicies: [],
            erc7739Policies: {
              allowedERC7739Content: [],
              erc1271Policies: [],
            },
            actions: [
              {
                actionTargetSelector: depositSelector,
                actionTarget: WETH,
                actionPolicies: [
                  {
                    policy: YES_POLICY_ADDRESS,
                    initData: "0x",
                  },
                ],
              },
              {
                actionTargetSelector: withdrawSelector,
                actionTarget: WETH,
                actionPolicies: [
                  {
                    policy: YES_POLICY_ADDRESS,
                    initData: "0x",
                  },
                ],
              },
            ],
          },
          {
            sessionValidator: TOKEN_SIGNER_ADDRESS,
            sessionValidatorInitData: encodeAbiParameters(
              [
                {
                  type: "address",
                  name: "account",
                },
                {
                  type: "address",
                  name: "tokenAddress",
                },
                {
                  type: "uint256",
                  name: "minAmount",
                },
              ],
              [account.address, EXP, parseEther("10")]
            ),
            salt: zeroHash,
            userOpPolicies: [],
            erc7739Policies: {
              allowedERC7739Content: [],
              erc1271Policies: [],
            },
            actions: [
              {
                actionTargetSelector: approvalSelector,
                actionTarget: USDC,
                actionPolicies: [
                  {
                    policy: YES_POLICY_ADDRESS,
                    initData: "0x",
                  },
                ],
              },
              {
                actionTargetSelector: approvalSelector,
                actionTarget: WETH,
                actionPolicies: [
                  {
                    policy: YES_POLICY_ADDRESS,
                    initData: "0x",
                  },
                ],
              },
              {
                actionTargetSelector: convertSelector,
                actionTarget: TOKEN_CONVERTER,
                actionPolicies: [
                  {
                    policy: YES_POLICY_ADDRESS,
                    initData: "0x",
                  },
                ],
              },
            ],
          },
        ],
      ],
    }),
  },
]);

console.log("Transaction Hash:", txHash);
