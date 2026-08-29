<template>
  <AdminAdminResourcePage title="Crops" endpoint="crops" />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Crops" });
</script>
