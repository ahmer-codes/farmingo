<template>
  <AdminAdminResourcePage title="Disease assessments" endpoint="disease" />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Disease" });
</script>
