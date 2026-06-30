<script setup lang="ts">
interface Option {
  value: string;
  label: string;
}

withDefaults(
  defineProps<{
    modelValue: string;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    id?: string;
    name?: string;
  }>(),
  {
    placeholder: "",
    disabled: false,
    invalid: false,
    id: undefined,
    name: undefined,
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <select
    :id="id"
    :name="name"
    :value="modelValue"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    class="block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
    :class="
      invalid
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    "
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
