<template>
  <AdminAdminResourcePage title="Farms" endpoint="farms" />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Farms" });
</script>
