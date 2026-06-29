<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    rows?: number;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    id?: string;
    name?: string;
  }>(),
  {
    rows: 3,
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
  <textarea
    :id="id"
    :name="name"
    :rows="rows"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    class="block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
    :class="
      invalid
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    "
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
</template>
