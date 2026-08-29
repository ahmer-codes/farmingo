export function useAdminPageLoading() {
  const showPageLoading = useState("delayed-page-loading", () => false);

  function startAdminPageLoading() {
    showPageLoading.value = true;
  }

  function stopAdminPageLoading() {
    showPageLoading.value = false;
  }

  return {
    showPageLoading,
    startAdminPageLoading,
    stopAdminPageLoading,
  };
}
