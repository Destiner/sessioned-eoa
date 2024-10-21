<template>
  <div class="page">
    <div class="content">
      <div class="account-grid">
        <div class="account">
          <h2>Your account</h2>
          <div>Address: {{ connectedAccount.address }}</div>
        </div>
        <div class="account">
          <h2>Smart account (EOA)</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getAccount } from '@wagmi/core';

import { config } from '@/wagmi';

const connectedAccount = getAccount(config);
</script>
