<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
});
</script>

<template>
  <div
    :class="visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
    class="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-dark-400/90 backdrop-blur-sm transition-all duration-200"
  >
    <div
      class="mx-4 flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border-2 border-dashed border-accent-100 bg-accent-100/10 p-16 shadow-2xl shadow-accent-100/20"
    >
      <slot />
      <div class="text-center">
        <h3 class="mb-3 text-3xl font-bold text-white">{{ title }}</h3>
        <p class="text-lg text-gray-300">{{ subtitle }}</p>
      </div>
    </div>
  </div>
</template>
