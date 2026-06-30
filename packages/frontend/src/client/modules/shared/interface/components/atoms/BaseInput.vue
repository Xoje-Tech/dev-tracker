<script setup lang="ts">
interface Props {
  modelValue: string;
  type?: "text" | "email" | "password" | "number";
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  autocomplete?: string;
  name?: string;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  type: "text",
  placeholder: "",
  disabled: false,
  invalid: false,
  autocomplete: "off",
  name: undefined,
  id: undefined,
});

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :id="id"
    :name="name"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :autocomplete="autocomplete"
    :aria-invalid="invalid || undefined"
    class="block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
    :class="
      invalid
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    "
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
