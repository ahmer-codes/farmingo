<template>
  <AdminAdminResourcePage title="Yield records" endpoint="yields" />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Yield" });
</script>
