<template>
  <form @submit.prevent>
    <Input
      v-model="input"
      class="input"
      :placeholder
      :disabled
    />
    <slot />
  </form>
</template>

<script setup lang="ts">
import Input from './Input.vue';

const input = defineModel<string>({
  required: true,
});

const { disabled = false } = defineProps<{
  placeholder: string;
  disabled?: boolean;
}>();
</script>

<style scoped>
.input {
  width: 180px;
  border-right: none;
}
</style>
