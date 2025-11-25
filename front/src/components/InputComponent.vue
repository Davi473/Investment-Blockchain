<template>
  <div class="text-start w-100">
    <label
      class="form-label ms-2"
      :class="error ? 'text-danger' : ''"
    >
      {{ error ? error : label }}
    </label>

    <div class="position-relative w-100" style="max-width: 400px">
      <input
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        @input="(e: any) => emit('update:modelValue', e.target.value)"
        class="form-control rounded-pill shadow-sm ps-4 pe-5 bg-light border-0"
      />

      <button
        v-if="type === 'password'"
        type="button"
        class="btn position-absolute top-50 end-0 translate-middle-y pe-3 border-0"
        @click="togglePassword"
      >
        <i :class="showPassword ? 'bi bi-eye' : 'bi bi-eye-slash'"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  label?: string;
  type?: string;
  modelValue: string;
  placeholder?: string;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text"
});

const emit = defineEmits(["update:modelValue"]);

const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const computedType = computed(() => {
  if (props.type !== "password") return props.type;
  return showPassword.value ? "text" : "password";
});
</script>
