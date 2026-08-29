<template>
  <div class="surface-card p-5 space-y-3">
    <UiSectionHeader
      title="Admin settings"
      description="Provisioning and security notes"
    />
    <p class="type-body">
      Admin access is controlled by Firebase custom claims (<code
        >role: admin</code
      >). Use the backend scripts to grant admin access, never store passwords
      in Firestore.
    </p>
    <pre class="overflow-x-auto rounded-md bg-canvas p-3 text-xs">
ADMIN_BOOTSTRAP_EMAILS=you@example.com npx tsx scripts/create-admin.ts you@example.com</pre
    >
    <pre class="overflow-x-auto rounded-md bg-canvas p-3 text-xs">
ADMIN_BOOTSTRAP_EMAILS=you@example.com npx tsx scripts/grant-admin.ts you@example.com</pre
    >
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Settings" });
</script>
