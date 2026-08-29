<template>
  <AdminAdminResourcePage title="Tasks" endpoint="tasks" />
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Tasks" });
</script>
