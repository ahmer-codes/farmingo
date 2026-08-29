<template>
  <footer class="relative mt-8 overflow-hidden border-t border-line text-white">
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: `url(${footerBg})` }"
      aria-hidden="true"
    />
    <div class="absolute inset-0 bg-brand-900/90" aria-hidden="true" />

    <div
      class="relative mx-auto grid max-w-content gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-6"
    >
      <div>
        <p class="text-lg font-semibold tracking-tight">Farmingo</p>
        <p class="mt-2 max-w-sm text-sm leading-relaxed text-brand-100">
          Practical tools to monitor fields, protect crop health, and plan
          treatments with confidence.
        </p>
      </div>
      <div>
        <p class="type-label text-brand-300">Workspace</p>
        <ul class="mt-3 space-y-1.5 text-sm text-brand-50">
          <li>
            <NuxtLink to="/dashboard" class="hover:text-white"
              >Dashboard</NuxtLink
            >
          </li>
          <li><NuxtLink to="/farm" class="hover:text-white">Farm</NuxtLink></li>
          <li>
            <NuxtLink to="/crops" class="hover:text-white">Crops</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/tasks" class="hover:text-white">Tasks</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/weather" class="hover:text-white">Weather</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/yield" class="hover:text-white"
              >Yield Analytics</NuxtLink
            >
          </li>
        </ul>
      </div>
      <div>
        <p class="type-label text-brand-300">About</p>
        <p class="mt-3 text-sm text-brand-100">
          Built for farmers, oriented around your farm operations.
        </p>
      </div>
    </div>

    <div
      class="relative border-t border-white/10 px-4 py-3 text-center text-xs text-brand-200 lg:px-6"
    >
      © {{ year }} Farmingo
    </div>
  </footer>
</template>

<script setup lang="ts">
import footerBgUrl from "~/assets/footer-bg.jpeg";

const footerBg = footerBgUrl;
const year = new Date().getFullYear();
</script>
