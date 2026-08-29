<script setup lang="ts">
definePageMeta({ middleware: "auth" });
await navigateTo("/crops", { replace: true });
</script>
