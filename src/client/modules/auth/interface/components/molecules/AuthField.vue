<script setup lang="ts">
import BaseInput from "@client/shared/interface/components/atoms/BaseInput.vue";
import FieldError from "@client/auth/interface/components/atoms/FieldError.vue";

withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    type?: "text" | "email" | "password";
    error?: string | null;
    autocomplete?: string;
    id?: string;
    name?: string;
    placeholder?: string;
  }>(),
  {
    type: "text",
    error: null,
    autocomplete: "off",
    id: undefined,
    name: undefined,
    placeholder: "",
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="space-y-1">
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <BaseInput
      :id="id"
      :name="name"
      :type="type"
      :model-value="modelValue"
      :invalid="!!error"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <FieldError :message="error" />
  </div>
</template>
