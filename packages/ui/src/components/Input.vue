<template>
  <input
    v-model="input"
    :disabled
    :placeholder
  />
</template>

<script setup lang="ts">
const input = defineModel<string>({
  required: true,
});

const { disabled = false } = defineProps<{
  placeholder: string;
  disabled?: boolean;
}>();
</script>

<style scoped>
input {
  width: 100%;
  padding: 8px;
  border: 1px solid black;
  outline: none;
}
</style>
