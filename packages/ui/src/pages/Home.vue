<template>
  <div class="page">
    <div class="content">
      <div class="account-grid">
        <div class="account">
          <h2>Your account</h2>
          <div class="account-content">
            <template v-if="!isConnected">
              <Button
                label="Connect"
                primary
                @click="openConnectorModal"
              />
            </template>
            <template v-else>
              <div class="account-header">
                <div>
                  <div>Address</div>
                  <div>{{ connectedAddress }}</div>
                </div>
                <div>
                  <div>Chain</div>
                  <div v-if="connectedChainId === odysseyTestnet.id">
                    Odyssey Testnet
                  </div>
                  <div v-else>
                    <Button
                      label="Use Odyssey"
                      primary
                      @click="useOdysseyChain"
                    />
                  </div>
                </div>
                <Button
                  label="Disconnect"
                  @click="handleDisconnectClick"
                />
              </div>
              <div>
                <div>Balances</div>
                <div>{{ formatEther(connectedEthBalance) }} ETH</div>
                <div>{{ formatEther(connectedExpBalance) }} EXP</div>
                <div>
                  {{ formatEther(connectedLockedExpBalance) }} locked EXP
                </div>
              </div>
              <div class="get-eth">
                <Button
                  label="Get ETH ↗"
                  url="https://odyssey-fba0638ec5f46615.testnets.rollbridge.app"
                  :primary="connectedEthBalance === 0n"
                />
              </div>
              <div class="get-exp">
                <Button
                  label="Mint EXP"
                  :primary="
                    connectedEthBalance > 0n && connectedExpBalance === 0n
                  "
                  :disabled="isMintingExp"
                  @click="mintExp"
                />
                <Button
                  label="Approve EXP"
                  :primary="
                    connectedEthBalance > 0n &&
                    connectedExpBalance > 0n &&
                    connectedExpAllowance === 0n &&
                    connectedLockedExpBalance === 0n
                  "
                  :disabled="isApprovingExp"
                  @click="approveExp"
                />
                <Button
                  label="Lock EXP"
                  :primary="
                    connectedEthBalance > 0n &&
                    connectedExpBalance > 0n &&
                    connectedExpAllowance > 0n &&
                    connectedLockedExpBalance === 0n
                  "
                  :disabled="isLockingExp"
                  @click="lockExp"
                />
              </div>
              <a
                v-if="mintExpTxHash"
                :href="getTxLink(mintExpTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explorer ↗
              </a>
              <a
                v-if="approveExpTxHash"
                :href="getTxLink(approveExpTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explorer ↗
              </a>
              <a
                v-if="lockExpTxHash"
                :href="getTxLink(lockExpTxHash)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explorer ↗
              </a>
            </template>
          </div>
        </div>
        <div class="account">
          <h2>Smart EOA</h2>
          <div class="account-content">
            <div>
              <div>Address</div>
              <div>{{ accountAddress }}</div>
            </div>
            <div>
              <div>Balances</div>
              <div>{{ formatEther(accountEthBalance) }} ETH</div>
              <div>{{ formatEther(accountWethBalance) }} WETH</div>
              <div>{{ formatEther(accountUsdcBalance) }} USDC</div>
            </div>
            <div
              class="actions"
              :class="{ forbidden: !anySessionAvailable }"
            >
              <h3>Everyone</h3>
              <div class="action-content">
                <Form
                  v-model="wrapAmount"
                  placeholder="amount"
                  :invalid="!isWethDepositInputValid"
                >
                  <Button
                    label="Wrap Ether"
                    :disabled="
                      isWrappingEth ||
                      !isWethDepositInputValid ||
                      wrapAmount === '' ||
                      !isConnected
                    "
                    @click="wethDeposit"
                  />
                </Form>
                <a
                  v-if="wrapEthTxHash"
                  :href="getTxLink(wrapEthTxHash)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explorer ↗
                </a>
                <Form
                  v-model="unwrapAmount"
                  placeholder="amount"
                  :invalid="!isWethWithdrawInputValid"
                >
                  <Button
                    label="Unwrap Ether"
                    :disabled="
                      isUnwrappingEth ||
                      !isWethWithdrawInputValid ||
                      unwrapAmount === '' ||
                      !isConnected
                    "
                    @click="wethWithdraw"
                  />
                </Form>
                <a
                  v-if="unwrapEthTxHash"
                  :href="getTxLink(unwrapEthTxHash)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explorer ↗
                </a>
              </div>
            </div>
            <div
              class="actions"
              :class="{ forbidden: !tokenSessionAvailable }"
            >
              <h3>100 EXP locked</h3>
              <div class="action-content">
                <Form
                  v-model="convertAmount"
                  placeholder="amount"
                  :invalid="!isConvertInputValid"
                >
                  <Select
                    v-model="convertToken"
                    :options="[
                      { value: WETH_ADDRESS, label: 'WETH' },
                      { value: USDC_ADDRESS, label: 'USDC' },
                    ]"
                  />
                </Form>
                <Form
                  v-model="convertOutAmount"
                  disabled
                  placeholder="amount"
                >
                  <Select
                    v-model="convertOutToken"
                    disabled
                    :options="[
                      { value: WETH_ADDRESS, label: 'WETH' },
                      { value: USDC_ADDRESS, label: 'USDC' },
                    ]"
                  />
                </Form>
                <Button
                  label="Swap"
                  :disabled="
                    isConverting ||
                    !isConvertInputValid ||
                    convertAmount === '' ||
                    !isConnected
                  "
                  @click="convert"
                />
                <a
                  v-if="convertTxHash"
                  :href="getTxLink(convertTxHash)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explorer ↗
                </a>
              </div>
            </div>
            <div
              class="actions"
              :class="{ forbidden: !ownerSessionAvaialble }"
            >
              <h3>Owner only</h3>
              <div class="action-content">
                <Form
                  v-model="transferAmount"
                  placeholder="amount"
                  :invalid="!isTransferInputValid"
                >
                  <Select
                    v-model="transferToken"
                    :options="[
                      { value: WETH_ADDRESS, label: 'WETH' },
                      { value: USDC_ADDRESS, label: 'USDC' },
                    ]"
                  />
                </Form>
                <Input
                  v-model="transferTarget"
                  placeholder="address"
                />
                <Button
                  label="Send"
                  :disabled="
                    isTransferring ||
                    !isTransferInputValid ||
                    transferAmount === '' ||
                    !isConnected
                  "
                  @click="transfer"
                />
                <a
                  v-if="transferTxHash"
                  :href="getTxLink(transferTxHash)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explorer ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <DialogConnectors
      v-model:model-value="isConnectorModalOpen"
      @select="handleConnectorSelect"
    />
  </div>
</template>

<script setup lang="ts">
import type { Connector } from '@wagmi/core';
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useConnectorClient,
  useSignMessage,
  useClient,
} from '@wagmi/vue';
import { LibZip } from 'solady';
import {
  parseEther,
  formatEther,
  isAddress,
  zeroAddress,
  parseGwei,
  SwitchChainError,
  encodePacked,
  encodeAbiParameters,
  encodeFunctionData,
  http,
  createPublicClient,
} from 'viem';
import type { Address, Hex } from 'viem';
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint07Abi,
  entryPoint07Address,
} from 'viem/account-abstraction';
import { addChain, waitForTransactionReceipt } from 'viem/actions';
import { odysseyTestnet } from 'viem/chains';
import { computed, ref } from 'vue';

import erc20Abi from '@/abi/erc20.js';
import expTokenAbi from '@/abi/expToken.js';
import tokenConverterAbi from '@/abi/tokenConverter.js';
import tokenStakerAbi from '@/abi/tokenStaker.js';
import wethAbi from '@/abi/weth.js';
import Button from '@/components/Button.vue';
import DialogConnectors from '@/components/DialogConnectors.vue';
import Form from '@/components/Form.vue';
import Input from '@/components/Input.vue';
import Select from '@/components/Select.vue';
import useEnv from '@/composables/useEnv';
import { Execution, getOpHash, prepare, submit } from '@/utils/sendOp';

const TOKEN_STAKER_ADDRESS = '0xD54557044A1F7E7ffC92c3dA78Da98BbA49B4e71';
const EXP_ADDRESS = '0xaa52Be611a9b620aFF67FbC79326e267cc3F2c69';
const USDC_ADDRESS = '0x649f9eF783A55d318b559809Ea465BC92A7456cC';
const WETH_ADDRESS = '0x582fCdAEc1D2B61c1F71FC5e3D2791B8c76E44AE';
const TOKEN_CONVERTER_ADDRESS = '0xD36100d4d3328F29f4D56c6dE4b8a6292f9aa002';
const SMART_SESSION_ADDRESS = '0x4988c01C4a1B8Bd32E40ecc7561a7669A6CC8295';

const accountAddress = '0xCab9F2377F4BdC15dcCB2D2F3799a03557cF0E7a';

const { bundlerRpc, paymasterRpc } = useEnv();

const connectorClient = useConnectorClient();
const connectedAccount = useAccount();
const isConnected = computed(() => connectedAccount.isConnected.value);
const connectedAddress = computed(
  () => connectedAccount.address.value || zeroAddress,
);
const connectedChainId = computed(() => connectedAccount.chainId.value);

const { connect } = useConnect();
const { disconnect } = useDisconnect();
const { switchChainAsync } = useSwitchChain();
const { writeContractAsync } = useWriteContract();
const { signMessageAsync } = useSignMessage();
const connectedEthBalanceResult = useBalance({
  address: connectedAddress,
});
const connectedEthBalance = computed(() =>
  connectedEthBalanceResult.data.value
    ? connectedEthBalanceResult.data.value.value
    : 0n,
);
const connectedExpBalanceResult = useReadContract({
  abi: erc20Abi,
  address: EXP_ADDRESS,
  functionName: 'balanceOf',
  args: [connectedAddress],
});
const connectedExpBalance = computed(() =>
  connectedExpBalanceResult.data.value
    ? connectedExpBalanceResult.data.value
    : 0n,
);
const connectedExpAllowanceResult = useReadContract({
  abi: erc20Abi,
  address: EXP_ADDRESS,
  functionName: 'allowance',
  args: [connectedAddress, TOKEN_STAKER_ADDRESS],
});
const connectedExpAllowance = computed(() =>
  connectedExpAllowanceResult.data.value
    ? connectedExpAllowanceResult.data.value
    : 0n,
);
const connectedLockedExpBalanceResult = useReadContract({
  abi: tokenStakerAbi,
  address: TOKEN_STAKER_ADDRESS,
  functionName: 'erc20StakeOf',
  args: [connectedAddress, EXP_ADDRESS, accountAddress],
});
const connectedLockedExpBalance = computed(() =>
  connectedLockedExpBalanceResult.data.value
    ? connectedLockedExpBalanceResult.data.value
    : 0n,
);

const accountEthBalanceResult = useBalance({
  address: accountAddress,
});
const accountEthBalance = computed(() =>
  accountEthBalanceResult.data.value
    ? accountEthBalanceResult.data.value.value
    : 0n,
);
const accountWethBalanceResult = useReadContract({
  abi: erc20Abi,
  address: WETH_ADDRESS,
  functionName: 'balanceOf',
  args: [accountAddress],
});
const accountWethBalance = computed(() =>
  accountWethBalanceResult.data.value
    ? accountWethBalanceResult.data.value
    : 0n,
);
const accountUsdcBalanceResult = useReadContract({
  abi: erc20Abi,
  address: USDC_ADDRESS,
  functionName: 'balanceOf',
  args: [accountAddress],
});
const accountUsdcBalance = computed(() =>
  accountUsdcBalanceResult.data.value
    ? accountUsdcBalanceResult.data.value
    : 0n,
);

const accountNonceResult = useReadContract({
  address: entryPoint07Address,
  abi: entryPoint07Abi,
  functionName: 'getNonce',
  args: [accountAddress, encodeValidatorNonce(SMART_SESSION_ADDRESS)],
});

///// Session validation

const anySessionAvailable = computed(
  () => connectedAccount.address.value !== undefined,
);
const tokenSessionAvailable = computed(
  () => connectedLockedExpBalance.value >= parseEther('100'),
);
const ownerSessionAvaialble = computed(
  () => connectedAccount.address.value === accountAddress,
);

///// Input validation

const isWethDepositInputValid = computed(
  () =>
    wrapAmount.value === '' ||
    (!isNaN(parseFloat(wrapAmount.value)) &&
      parseEther(wrapAmount.value) <= accountEthBalance.value),
);
const isWethWithdrawInputValid = computed(
  () =>
    unwrapAmount.value === '' ||
    (!isNaN(parseFloat(unwrapAmount.value)) &&
      parseEther(unwrapAmount.value) <= accountWethBalance.value),
);
const isConvertInputValid = computed(
  () =>
    convertAmount.value === '' ||
    (!isNaN(parseFloat(convertAmount.value)) &&
      ((convertToken.value === WETH_ADDRESS &&
        parseEther(convertAmount.value) <= accountWethBalance.value) ||
        (convertToken.value === USDC_ADDRESS &&
          parseEther(convertAmount.value) <= accountUsdcBalance.value))),
);
const isTransferInputValid = computed(
  () =>
    transferAmount.value === '' ||
    (!isNaN(parseFloat(transferAmount.value)) &&
      ((transferToken.value === WETH_ADDRESS &&
        parseEther(transferAmount.value) <= accountWethBalance.value) ||
        (transferToken.value === USDC_ADDRESS &&
          parseEther(transferAmount.value) <= accountUsdcBalance.value))),
);

///// Latest transactions

const client = useClient();

const mintExpTxHash = ref<Hex | null>(null);
const isMintingExp = ref(false);
const approveExpTxHash = ref<Hex | null>(null);
const isApprovingExp = ref(false);
const lockExpTxHash = ref<Hex | null>(null);
const isLockingExp = ref(false);
const wrapEthTxHash = ref<Hex | null>(null);
const isWrappingEth = ref(false);
const unwrapEthTxHash = ref<Hex | null>(null);
const isUnwrappingEth = ref(false);
const convertTxHash = ref<Hex | null>(null);
const isConverting = ref(false);
const transferTxHash = ref<Hex | null>(null);
const isTransferring = ref(false);

async function useOdysseyChain(): Promise<void> {
  try {
    await switchChainAsync({
      chainId: odysseyTestnet.id,
    });
  } catch (e: unknown) {
    if (e instanceof SwitchChainError) {
      if (e.code === SwitchChainError.code) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await addChain(connectorClient.data.value, {
          chain: odysseyTestnet,
        });
        useOdysseyChain();
      }
    }
  }
}

const isConnectorModalOpen = ref(false);
function openConnectorModal(): void {
  isConnectorModalOpen.value = true;
}
async function handleConnectorSelect(connector: Connector): Promise<void> {
  isConnectorModalOpen.value = false;
  connect({
    connector,
    chainId: odysseyTestnet.id,
  });
}
function handleDisconnectClick(): void {
  disconnect();
}

const wrapAmount = ref<string>('');
const unwrapAmount = ref<string>('');
const convertAmount = ref<string>('');
const convertOutAmount = computed(() => {
  if (convertAmount.value === '') return '';
  const rate =
    convertToken.value === WETH_ADDRESS
      ? parseEther('2480')
      : (parseEther('1') * parseEther('1')) / parseEther('2480');
  return formatEther(
    (parseEther(convertAmount.value) * rate) / parseEther('1'),
  );
});
const convertToken = ref<Address>(WETH_ADDRESS);
const convertOutToken = computed(() =>
  convertToken.value === WETH_ADDRESS ? USDC_ADDRESS : WETH_ADDRESS,
);
const transferAmount = ref<string>('');
const transferToken = ref<Address>(WETH_ADDRESS);
const transferTarget = ref<string>('');

async function mintExp(): Promise<void> {
  if (!connectedAddress.value) {
    return;
  }
  isMintingExp.value = true;
  mintExpTxHash.value = null;
  const mintedAmount = parseEther('200');
  try {
    const txHash = await writeContractAsync({
      abi: expTokenAbi,
      address: EXP_ADDRESS,
      functionName: 'mint',
      args: [connectedAddress.value, mintedAmount],
      maxPriorityFeePerGas: parseGwei('5'),
      maxFeePerGas: parseGwei('6'),
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitForTransactionReceipt(client.value, {
      hash: txHash,
    });
    mintExpTxHash.value = txHash;
    isMintingExp.value = false;
  } catch {
    isMintingExp.value = false;
    return;
  }
  connectedExpBalanceResult.refetch();
}

async function approveExp(): Promise<void> {
  if (!connectedAddress.value) {
    return;
  }
  isApprovingExp.value = true;
  approveExpTxHash.value = null;
  const approvedAmount = parseEther('100');
  try {
    const txHash = await writeContractAsync({
      abi: expTokenAbi,
      address: EXP_ADDRESS,
      functionName: 'approve',
      args: [TOKEN_STAKER_ADDRESS, approvedAmount],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitForTransactionReceipt(client.value, {
      hash: txHash,
    });
    approveExpTxHash.value = txHash;
    isApprovingExp.value = false;
  } catch {
    isApprovingExp.value = false;
    return;
  }
  connectedExpAllowanceResult.refetch();
}

async function lockExp(): Promise<void> {
  if (!connectedAddress.value) {
    return;
  }
  isLockingExp.value = true;
  lockExpTxHash.value = null;
  const lockedAmount = parseEther('100');
  try {
    const txHash = await writeContractAsync({
      abi: tokenStakerAbi,
      address: TOKEN_STAKER_ADDRESS,
      functionName: 'stakeErc20',
      args: [accountAddress, EXP_ADDRESS, lockedAmount],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitForTransactionReceipt(client.value, {
      hash: txHash,
    });
    lockExpTxHash.value = txHash;
    isLockingExp.value = false;
  } catch {
    isLockingExp.value = false;
    return;
  }
}

async function wethDeposit(): Promise<void> {
  isWrappingEth.value = true;
  wrapEthTxHash.value = null;

  const amount = parseEther(wrapAmount.value);
  const opHash = await sendAnySignerOp([
    {
      target: WETH_ADDRESS,
      value: amount,
      callData: encodeFunctionData({
        abi: wethAbi,
        functionName: 'deposit',
      }),
    },
  ]);
  if (!opHash) {
    isWrappingEth.value = false;
    return;
  }
  const txHash = await getOpTxHash(opHash);
  if (!txHash) {
    isWrappingEth.value = false;
    return;
  }
  isWrappingEth.value = false;
  wrapEthTxHash.value = txHash;
  accountEthBalanceResult.refetch();
  accountWethBalanceResult.refetch();
}

async function wethWithdraw(): Promise<void> {
  isUnwrappingEth.value = true;
  unwrapEthTxHash.value = null;

  const amount = parseEther(unwrapAmount.value);
  const opHash = await sendAnySignerOp([
    {
      target: WETH_ADDRESS,
      value: 0n,
      callData: encodeFunctionData({
        abi: wethAbi,
        functionName: 'withdraw',
        args: [amount],
      }),
    },
  ]);
  if (!opHash) {
    isUnwrappingEth.value = false;
    return;
  }
  const txHash = await getOpTxHash(opHash);
  if (!txHash) {
    isUnwrappingEth.value = false;
    return;
  }
  isUnwrappingEth.value = false;
  unwrapEthTxHash.value = txHash;
  accountEthBalanceResult.refetch();
  accountWethBalanceResult.refetch();
}

async function convert(): Promise<void> {
  isConverting.value = true;
  convertTxHash.value = null;

  const amount = parseEther(convertAmount.value);
  const token = convertToken.value;
  const opHash = await sendTokenSignerOp([
    {
      target: token,
      value: 0n,
      callData: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [TOKEN_CONVERTER_ADDRESS, amount],
      }),
    },
    {
      target: TOKEN_CONVERTER_ADDRESS,
      value: 0n,
      callData: encodeFunctionData({
        abi: tokenConverterAbi,
        functionName: 'convert',
        args: [amount, token === WETH_ADDRESS],
      }),
    },
  ]);
  if (!opHash) {
    isConverting.value = false;
    return;
  }
  const txHash = await getOpTxHash(opHash);
  if (!txHash) {
    isConverting.value = false;
    return;
  }
  isConverting.value = false;
  convertTxHash.value = txHash;
  accountWethBalanceResult.refetch();
  accountUsdcBalanceResult.refetch();
}

async function transfer(): Promise<void> {
  isTransferring.value = true;
  transferTxHash.value = null;

  const amount = parseEther(transferAmount.value);
  const token = transferToken.value;
  const target = transferTarget.value;
  if (!isAddress(target)) {
    return;
  }
  // TODO send as user op
  try {
    const txHash = await writeContractAsync({
      abi: erc20Abi,
      address: token,
      functionName: 'transfer',
      args: [target, amount],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitForTransactionReceipt(client.value, {
      hash: txHash,
    });
    isTransferring.value = false;
    transferTxHash.value = txHash;
    accountWethBalanceResult.refetch();
    accountUsdcBalanceResult.refetch();
  } catch {
    isTransferring.value = false;
    return;
  }
}

async function getOpTxHash(opHash: Hex): Promise<Hex | null> {
  const publicClient = createPublicClient({
    chain: odysseyTestnet,
    transport: http(),
  });
  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(bundlerRpc),
  });
  try {
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: opHash,
    });
    return receipt.receipt.transactionHash;
  } catch {
    return null;
  }
}

async function sendAnySignerOp(executions: Execution[]): Promise<Hex | null> {
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  await accountNonceResult.refetch();
  const nonce = accountNonceResult.data.value;
  if (nonce === undefined) {
    throw new Error('Failed to get nonce');
  }
  const op = await prepare(accountAddress, paymasterClient, executions, {
    nonce,
  });
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  try {
    const sessionOwnerSignature = await signMessageAsync({
      message: {
        raw: hash,
      },
    });
    const permissionId =
      '0xb3835f0d5bba72de2b0e64e8e2bb72944c103c2a5a2d2f9a48975ae991643796';
    op.signature = encodeSessionSignature(permissionId, sessionOwnerSignature);
    const publicClient = createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    });
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerRpc),
    });
    const opHash = await submit(accountAddress, bundlerClient, op);
    return opHash;
  } catch {
    return null;
  }
}

async function sendTokenSignerOp(executions: Execution[]): Promise<Hex | null> {
  const paymasterClient = createPaymasterClient({
    transport: http(paymasterRpc),
  });
  await accountNonceResult.refetch();
  const nonce = accountNonceResult.data.value;
  if (nonce === undefined) {
    throw new Error('Failed to get nonce');
  }
  const op = await prepare(accountAddress, paymasterClient, executions, {
    nonce,
  });
  const hash = getOpHash(odysseyTestnet.id, entryPoint07Address, op);
  if (!hash) {
    throw new Error('Failed to get hash');
  }
  try {
    const sessionOwnerSignature = await signMessageAsync({
      message: {
        raw: hash,
      },
    });
    const permissionId =
      '0xb6d0d36e150601d7d3a465cc34d0031dfc09501d68e37097ec07340cf476fdbd';
    op.signature = encodeSessionSignature(permissionId, sessionOwnerSignature);
    const publicClient = createPublicClient({
      chain: odysseyTestnet,
      transport: http(),
    });
    const bundlerClient = createBundlerClient({
      client: publicClient,
      transport: http(bundlerRpc),
    });
    const opHash = await submit(accountAddress, bundlerClient, op);
    return opHash;
  } catch {
    return null;
  }
}

function encodeSessionSignature(permissionId: Hex, signature: Hex): Hex {
  return encodePacked(
    ['bytes1', 'bytes32', 'bytes'],
    [
      '0x00',
      permissionId,
      LibZip.flzCompress(
        encodeAbiParameters(
          [
            {
              type: 'bytes',
            },
          ],
          [signature],
        ),
      ) as Hex,
    ],
  );
}

function encodeValidatorNonce(validator: Address): bigint {
  const hex = `0x0001${validator.slice(2)}0000`;
  return BigInt(hex);
}

function getTxLink(txHash: Hex): string {
  return `https://odyssey-explorer.ithaca.xyz/tx/${txHash}`;
}
</script>

<style scoped>
.page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  width: 1000px;
  max-width: 100%;
  margin-top: 48px;
}

.account-grid {
  display: flex;
  width: 100%;
  gap: 16px;
}

.account {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 8px;
  border: 1px solid #b5b5b5;
  border-radius: 4px;
  gap: 24px;

  h2 {
    margin: 0;
  }
}

.account-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.account-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.get-exp {
  display: flex;
  gap: 8px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 2px;

  h3 {
    margin: 0;
    color: green;
    font-size: 14px;
    font-weight: normal;
  }

  .action-content {
    display: flex;
    gap: 8px;
    flex-direction: column;
    padding: 8px;
    border: 1px solid green;
    border-radius: 4px;
  }

  &.forbidden {
    h3 {
      color: red;
    }

    .action-content {
      border-color: red;
    }
  }
}
</style>
