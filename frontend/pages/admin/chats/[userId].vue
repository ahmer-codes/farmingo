<script setup lang="ts">
// Legacy route, redirect to inbox with user lookup for current conversation
definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
const route = useRoute();
await navigateTo({
  path: "/admin/chats",
  query: { user: String(route.params.userId || "") },
});
</script>

<template><div /></template>
