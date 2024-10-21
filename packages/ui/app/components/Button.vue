<template>
  <button :class="{ primary }">
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
const { primary = false } = defineProps<{
  label: string;
  primary?: boolean;
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
