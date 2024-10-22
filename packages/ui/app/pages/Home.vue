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
              <div>
                <div>Address</div>
                <div>{{ connectedAddress }}</div>
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
                  @click="mintExp"
                />
                <Button
                  label="Lock EXP"
                  :primary="
                    connectedEthBalance > 0n &&
                    connectedExpBalance > 0n &&
                    connectedLockedExpBalance === 0n
                  "
                  @click="lockExp"
                />
              </div>
            </template>
          </div>
        </div>
        <div class="account">
          <h2>Smart account (EOA)</h2>
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
            <div class="actions">
              <h3>Everyone</h3>
              <div class="action-content">
                <Form
                  v-model="wrapAmount"
                  placeholder="amount"
                >
                  <Button
                    label="Wrap Ether"
                    @click="wethDeposit"
                  />
                </Form>
                <Form
                  v-model="unwrapAmount"
                  placeholder="amount"
                >
                  <Button
                    label="Unwrap Ether"
                    @click="wethWithdraw"
                  />
                </Form>
              </div>
            </div>
            <div class="actions">
              <h3>100 EXP locked</h3>
              <div class="action-content">
                <Form
                  v-model="convertAmount"
                  placeholder="amount"
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
                  @click="convert"
                />
              </div>
            </div>
            <div class="actions">
              <h3>Owner only</h3>
              <div class="action-content">
                <Form
                  v-model="transferAmount"
                  placeholder="amount"
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
                  @click="transfer"
                />
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
  connect,
  disconnect,
  getBalance,
  readContract,
  switchChain,
  writeContract,
} from '@wagmi/core';
import { parseEther, formatEther, isAddress } from 'viem';
import type { Address } from 'viem';
import { odysseyTestnet } from 'viem/chains';
import { computed, onMounted, ref, watch } from 'vue';

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
import { config } from '@/wagmi';

const TOKEN_STAKER_ADDRESS = '0xD54557044A1F7E7ffC92c3dA78Da98BbA49B4e71';
const EXP_ADDRESS = '0xaa52Be611a9b620aFF67FbC79326e267cc3F2c69';
const USDC_ADDRESS = '0x649f9eF783A55d318b559809Ea465BC92A7456cC';
const WETH_ADDRESS = '0x582fCdAEc1D2B61c1F71FC5e3D2791B8c76E44AE';
const TOKEN_CONVERTER_ADDRESS = '0xD36100d4d3328F29f4D56c6dE4b8a6292f9aa002';

const accountAddress = '0xCab9F2377F4BdC15dcCB2D2F3799a03557cF0E7a';

const isConnected = ref(false);
const connectedAddress = ref<Address | null>(null);

const isConnectorModalOpen = ref(false);
function openConnectorModal(): void {
  isConnectorModalOpen.value = true;
}
async function handleConnectorSelect(connector: Connector): Promise<void> {
  isConnected.value = true;
  isConnectorModalOpen.value = false;
  const connectionResult = await connect(config, {
    connector,
  });
  await switchChain(config, { chainId: odysseyTestnet.id });
  connectedAddress.value = connectionResult.accounts[0];
  fetchConnectedBalance();
}
function handleDisconnectClick(): void {
  isConnected.value = false;
  disconnect(config);
}

const connectedEthBalance = ref<bigint>(0n);
const connectedExpBalance = ref<bigint>(0n);
const connectedLockedExpBalance = ref<bigint>(0n);

const accountEthBalance = ref<bigint>(0n);
const accountWethBalance = ref<bigint>(0n);
const accountUsdcBalance = ref<bigint>(0n);

onMounted(() => {
  fetchBalances();
});

async function fetchBalances(): Promise<void> {
  fetchConnectedBalance();
  fetchAccountBalance();
}

watch(
  () => connectedAddress,
  () => {
    fetchConnectedBalance();
  },
);

async function fetchConnectedBalance(): Promise<void> {
  if (!connectedAddress.value) {
    return;
  }
  connectedEthBalance.value = (
    await getBalance(config, {
      address: connectedAddress.value,
    })
  ).value;
  connectedExpBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: EXP_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAddress.value],
  });
  connectedLockedExpBalance.value = await readContract(config, {
    abi: tokenStakerAbi,
    address: TOKEN_STAKER_ADDRESS,
    functionName: 'erc20StakeOf',
    args: [connectedAddress.value, EXP_ADDRESS, accountAddress],
  });
}

async function fetchAccountBalance(): Promise<void> {
  accountEthBalance.value = (
    await getBalance(config, {
      address: accountAddress,
    })
  ).value;
  accountWethBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
  accountUsdcBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
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
  const mintedAmount = parseEther('100');
  await writeContract(config, {
    abi: expTokenAbi,
    address: EXP_ADDRESS,
    functionName: 'mint',
    args: [connectedAddress.value, mintedAmount],
  });
  connectedEthBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAddress.value],
  });
}

async function lockExp(): Promise<void> {
  if (!connectedAddress.value) {
    return;
  }
  const lockedAmount = parseEther('50');
  await writeContract(config, {
    abi: expTokenAbi,
    address: EXP_ADDRESS,
    functionName: 'approve',
    args: [TOKEN_STAKER_ADDRESS, lockedAmount],
  });
  await writeContract(config, {
    abi: tokenStakerAbi,
    address: TOKEN_STAKER_ADDRESS,
    functionName: 'stakeErc20',
    args: [accountAddress, EXP_ADDRESS, lockedAmount],
  });
  connectedExpBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: EXP_ADDRESS,
    functionName: 'balanceOf',
    args: [connectedAddress.value],
  });
  connectedLockedExpBalance.value = await readContract(config, {
    abi: tokenStakerAbi,
    address: TOKEN_STAKER_ADDRESS,
    functionName: 'erc20StakeOf',
    args: [connectedAddress.value, EXP_ADDRESS, accountAddress],
  });
}

async function wethDeposit(): Promise<void> {
  await writeContract(config, {
    abi: wethAbi,
    address: WETH_ADDRESS,
    functionName: 'deposit',
    value: parseEther(wrapAmount.value),
  });
  accountEthBalance.value = (
    await getBalance(config, {
      address: accountAddress,
    })
  ).value;
  accountWethBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
}

async function wethWithdraw(): Promise<void> {
  await writeContract(config, {
    abi: wethAbi,
    address: WETH_ADDRESS,
    functionName: 'withdraw',
    args: [parseEther(unwrapAmount.value)],
  });
  accountEthBalance.value = (
    await getBalance(config, {
      address: accountAddress,
    })
  ).value;
  accountWethBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
}

async function convert(): Promise<void> {
  const amount = parseEther(convertAmount.value);
  const token = convertToken.value;
  await writeContract(config, {
    abi: erc20Abi,
    address: token,
    functionName: 'approve',
    args: [TOKEN_CONVERTER_ADDRESS, amount],
  });
  await writeContract(config, {
    abi: tokenConverterAbi,
    address: TOKEN_CONVERTER_ADDRESS,
    functionName: 'convert',
    args: [amount, token === WETH_ADDRESS],
  });
  accountWethBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
  accountUsdcBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
}

async function transfer(): Promise<void> {
  const amount = parseEther(transferAmount.value);
  const token = transferToken.value;
  const target = transferTarget.value;
  if (!isAddress(target)) {
    return;
  }
  await writeContract(config, {
    abi: erc20Abi,
    address: token,
    functionName: 'transfer',
    args: [target, amount],
  });
  accountWethBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: WETH_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
  accountUsdcBalance.value = await readContract(config, {
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: 'balanceOf',
    args: [accountAddress],
  });
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
  gap: 8px;
}

.get-exp {
  display: flex;
  gap: 8px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

h3 {
  margin: 0;
}

.action-content {
  display: flex;
  gap: 8px;
  flex-direction: column;
  padding: 8px;
  border: 1px solid #b5b5b5;
  border-radius: 4px;
}
</style>
