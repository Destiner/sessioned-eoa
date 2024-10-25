<template>
  <input
    v-model="input"
    :disabled
    :placeholder
    :class="{ invalid }"
  />
</template>

<script setup lang="ts">
const input = defineModel<string>({
  required: true,
});

const { disabled = false, invalid = false } = defineProps<{
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
}>();
</script>

<style scoped>
input {
  width: 100%;
  padding: 8px;
  border: 1px solid black;
  outline: none;

  &:disabled {
    background-color: #f0f0f0;
  }

  &.invalid {
    border-color: red;
  }
}
</style>
