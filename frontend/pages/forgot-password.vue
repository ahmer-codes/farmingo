<template>
  <div>
    <h2 class="type-page-title">Forgot password</h2>
    <p class="mt-1 type-body">
      Enter your email and we’ll send a password reset link.
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <UiAppInput
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@farm.example"
        required
      />

      <UiErrorState
        v-if="formError"
        :message="formError"
        title="Request failed"
      />
      <UiAppSuccessState
        v-if="successMessage"
        title="Check your inbox"
        :message="successMessage"
      />

      <UiAppButton type="submit" class="w-full" :loading="submitting">
        Send reset link
      </UiAppButton>
    </form>

    <p class="mt-5 type-body">
      <NuxtLink to="/login" class="font-medium text-brand-700 hover:underline"
        >Back to sign in</NuxtLink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({ title: "Forgot password" });

const { resetPassword } = useAuth();
const email = ref("");
const submitting = ref(false);
const formError = ref("");
const successMessage = ref("");

async function onSubmit() {
  submitting.value = true;
  formError.value = "";
  successMessage.value = "";
  try {
    const result = await resetPassword(email.value);
    successMessage.value = result.message;
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Unable to process request";
  } finally {
    submitting.value = false;
  }
}
</script>
