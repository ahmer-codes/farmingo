<template>
  <div>
    <h2 class="type-page-title">
      {{ isAdminLogin ? "Admin sign in" : "Sign in" }}
    </h2>
    <p class="type-body mt-1">
      {{
        isAdminLogin
          ? "Access the Farmingo operations console."
          : "Access your farm workspace."
      }}
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <UiAppInput
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@farm.example"
        :error="errors.email"
        required
      />
      <UiAppInput
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        placeholder="••••••••"
        :error="errors.password"
        required
      />

      <UiErrorState
        v-if="formError"
        :message="formError"
        title="Sign-in failed"
      />

      <UiAppButton type="submit" class="w-full" :loading="submitting">
        {{ isAdminLogin ? "Sign in to admin" : "Sign in" }}
      </UiAppButton>
    </form>

    <div
      class="mt-5 flex flex-col gap-2 type-body sm:flex-row sm:justify-between"
    >
      <NuxtLink
        to="/forgot-password"
        class="font-medium text-brand-700 hover:underline"
      >
        Forgot password?
      </NuxtLink>
      <NuxtLink
        v-if="!isAdminLogin"
        to="/register"
        class="font-medium text-brand-700 hover:underline"
      >
        Create an account
      </NuxtLink>
      <NuxtLink
        v-else
        to="/login"
        class="font-medium text-brand-700 hover:underline"
      >
        Farmer sign in instead
      </NuxtLink>
    </div>

    <p v-if="!isAdminLogin" class="mt-4 text-center type-helper">
      <NuxtLink
        :to="{ path: '/login', query: { admin: '1', redirect: '/admin' } }"
        class="font-medium text-brand-700 hover:underline"
      >
        Admin sign in
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({ title: "Sign in" });

const route = useRoute();
const isAdminLogin = computed(
  () => route.query.admin === "1" || route.query.redirect === "/admin",
);

watch(
  isAdminLogin,
  (admin) => {
    useHead({ title: admin ? "Admin sign in" : "Sign in" });
  },
  { immediate: true },
);

const { login } = useAuth();
const email = ref("");
const password = ref("");
const submitting = ref(false);
const formError = ref("");
const errors = reactive<{ email?: string; password?: string }>({});

async function onSubmit() {
  formError.value = "";
  errors.email = undefined;
  errors.password = undefined;

  if (!email.value.trim()) errors.email = "Email is required";
  if (!password.value) errors.password = "Password is required";
  if (errors.email || errors.password) return;

  submitting.value = true;
  try {
    await login({ email: email.value.trim(), password: password.value });
    await navigateAfterLogin();
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Unable to sign in";
  } finally {
    submitting.value = false;
  }
}
</script>
