<template>
  <button
    :class="{ primary }"
    :disabled
  >
    <a
      v-if="url"
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ label }}
    </a>
    <template v-else>
      {{ label }}
    </template>
  </button>
</template>

<script setup lang="ts">
const { primary = false, disabled = false } = defineProps<{
  label: string;
  primary?: boolean;
  disabled?: boolean;
  url?: string;
}>();
</script>

<style scoped>
button {
  width: 120px;
  padding: 8px;
  border: none;
  border: 1px solid black;
  background: white;
  color: black;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: black;
    color: white;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}
</style>
