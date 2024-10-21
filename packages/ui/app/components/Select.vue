<template>
  <select
    v-model="selected"
    :disabled
  >
    <option
      v-for="(option, index) in options"
      :key="index"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
const selected = defineModel<string>({
  required: true,
});

const { disabled = false } = defineProps<{
  disabled?: boolean;
  options: { value: string; label: string }[];
}>();
</script>

<style scoped>
select {
  padding: 7px;
  border: 1px solid black;
  outline: none;
}
</style>
