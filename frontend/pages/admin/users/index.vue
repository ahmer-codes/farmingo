<template>
  <div class="space-y-3 md:space-y-6">
    <header>
      <p class="type-helper max-w-3xl">
        Customer control center, search accounts, review activity, manage
        access, and jump into support conversations. All status changes are
        enforced on the server.
      </p>
    </header>

    <div class="flex flex-col gap-3 md:gap-6">
      <div
        v-if="statsLoading && !stats"
        class="admin-users-stats order-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-5 lg:order-1"
      >
        <UiStatCardSkeleton v-for="n in 5" :key="n" />
      </div>
      <section
        v-else-if="stats"
        aria-label="User metrics"
        class="admin-users-stats order-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-5 lg:order-1"
      >
        <AdminAdminStatCard
          class="admin-users-stat-card"
          label="Total users"
          :value="formatNumber(stats.totalUsers)"
        />
        <AdminAdminStatCard
          class="admin-users-stat-card"
          label="Active today"
          :value="formatNumber(stats.activeToday)"
          helper="lastActiveAt since midnight"
        />
        <AdminAdminStatCard
          class="admin-users-stat-card"
          label="Active this week"
          :value="formatNumber(stats.activeThisWeek)"
        />
        <AdminAdminStatCard
          class="admin-users-stat-card"
          label="Disabled users"
          :value="formatNumber(stats.disabledUsers)"
        />
        <AdminAdminStatCard
          class="admin-users-stat-card"
          label="New this month"
          :value="formatNumber(stats.newUsersThisMonth)"
          helper="account createdAt"
        />
      </section>

      <div class="order-1 flex flex-col gap-3 md:gap-6 lg:order-2">
        <section class="surface-card p-4" aria-label="User filters">
          <div
            class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
          >
            <label class="flex min-w-[14rem] flex-1 flex-col gap-1">
              <span class="type-label">Search</span>
              <input
                v-model="search"
                type="search"
                placeholder="Email or name prefix…"
                class="rounded-md border border-line bg-white px-3 py-2 text-sm"
                @keyup.enter="load(true)"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="type-label">Status</span>
              <select
                v-model="statusFilter"
                class="rounded-md border border-line bg-white px-3 py-2 text-sm"
                @change="load(true)"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <label class="flex flex-col gap-1">
              <span class="type-label">Activity</span>
              <select
                v-model="activityFilter"
                class="rounded-md border border-line bg-white px-3 py-2 text-sm"
                @change="load(true)"
              >
                <option
                  v-for="option in ADMIN_USER_ACTIVITY_FILTER_OPTIONS"
                  :key="option.value || 'all'"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1">
              <span class="type-label">Account type</span>
              <select
                v-model="accountTypeFilter"
                class="rounded-md border border-line bg-white px-3 py-2 text-sm"
                @change="load(true)"
              >
                <option value="">All types</option>
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label class="flex flex-col gap-1">
              <span class="type-label">Joined</span>
              <select
                v-model="joinedFilter"
                class="rounded-md border border-line bg-white px-3 py-2 text-sm"
                @change="load(true)"
              >
                <option
                  v-for="option in ADMIN_USER_JOINED_FILTER_OPTIONS"
                  :key="option.value || 'any'"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <div class="flex flex-wrap gap-2">
              <UiAppButton
                variant="primary"
                size="sm"
                :loading="loading"
                @click="load(true)"
              >
                Apply
              </UiAppButton>
              <UiAppButton
                variant="secondary"
                size="sm"
                :disabled="!hasActiveFilters"
                @click="clearFilters"
              >
                Clear filters
              </UiAppButton>
            </div>
          </div>

          <p class="type-helper mt-3 text-xs">{{ ADMIN_USER_SEARCH_HELP }}</p>
        </section>

        <div v-if="loading" class="space-y-4">
          <div
            class="hidden overflow-hidden rounded-lg border border-line bg-white lg:block"
          >
            <div class="divide-y divide-line/70 p-2">
              <UiTableRowSkeleton
                v-for="n in 8"
                :key="n"
                compact
                show-meta
                show-actions
              />
            </div>
          </div>
          <div class="space-y-3 lg:hidden">
            <UiTableRowSkeleton
              v-for="n in 4"
              :key="n"
              show-meta
              show-actions
            />
          </div>
        </div>
        <UiErrorState
          v-else-if="error"
          :message="error"
          retry-label="Retry"
          @retry="load(true)"
        />

        <template v-else>
          <div
            class="hidden overflow-hidden rounded-lg border border-line bg-white lg:block"
          >
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="border-b border-line bg-canvas text-left">
                  <tr>
                    <th class="px-4 py-3 font-semibold">User</th>
                    <th class="px-4 py-3 font-semibold">Email</th>
                    <th class="px-4 py-3 font-semibold">Status</th>
                    <th class="px-4 py-3 font-semibold">Last active</th>
                    <th class="px-4 py-3 font-semibold">Last login</th>
                    <th class="px-4 py-3 font-semibold">Joined</th>
                    <th class="px-4 py-3 font-semibold text-center">Farms</th>
                    <th class="px-4 py-3 font-semibold text-center">Crops</th>
                    <th class="px-4 py-3 font-semibold text-center">Tasks</th>
                    <th class="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingMore">
                    <td colspan="10" class="px-4 py-3">
                      <UiTableRowSkeleton
                        v-for="n in 2"
                        :key="n"
                        compact
                        show-meta
                      />
                    </td>
                  </tr>
                  <tr
                    v-for="user in users"
                    :key="user.id"
                    class="border-b border-line/70 hover:bg-canvas/40"
                  >
                    <td class="px-4 py-3">
                      <NuxtLink
                        :to="`/admin/users/${user.id}`"
                        class="font-medium text-brand-700 hover:underline"
                      >
                        {{ user.fullName }}
                      </NuxtLink>
                      <p class="type-helper mt-0.5 capitalize">
                        {{ user.accountType || "farmer" }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-ink-secondary">
                      {{ user.email }}
                    </td>
                    <td class="px-4 py-3">
                      <UiStatusBadge
                        :tone="user.status === 'active' ? 'success' : 'danger'"
                        dot
                        compact
                      >
                        {{ user.status }}
                      </UiStatusBadge>
                    </td>
                    <td class="px-4 py-3">
                      <p>{{ formatLastActiveLabel(user.lastActiveAt) }}</p>
                      <UiStatusBadge
                        :tone="activityRecencyTone(user.lastActiveAt)"
                        compact
                        class="mt-1"
                      >
                        {{ activityRecencyLabel(user.lastActiveAt) }}
                      </UiStatusBadge>
                    </td>
                    <td class="px-4 py-3">
                      {{ formatLastLoginLabel(user.lastLoginAt) }}
                    </td>
                    <td class="px-4 py-3">
                      <p>{{ formatJoinedLabel(user.createdAt) }}</p>
                      <p class="type-helper mt-0.5">
                        {{ formatAdminDate(user.createdAt) }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-center tabular-nums">
                      {{ user.counts.farms }}
                    </td>
                    <td class="px-4 py-3 text-center tabular-nums">
                      {{ user.counts.crops }}
                    </td>
                    <td class="px-4 py-3 text-center tabular-nums">
                      {{ user.counts.tasks }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1">
                        <NuxtLink :to="`/admin/users/${user.id}`">
                          <UiAppButton size="sm" variant="secondary"
                            >View</UiAppButton
                          >
                        </NuxtLink>
                        <UiAppButton
                          v-if="canToggleStatus(user)"
                          size="sm"
                          :variant="
                            user.status === 'active' ? 'secondary' : 'primary'
                          "
                          :loading="statusUpdatingId === user.id"
                          @click="toggleStatus(user)"
                        >
                          {{
                            user.status === "active" ? "Disable" : "Re-enable"
                          }}
                        </UiAppButton>
                        <NuxtLink :to="`/admin/chats?user=${user.id}`">
                          <UiAppButton size="sm" variant="secondary"
                            >Support</UiAppButton
                          >
                        </NuxtLink>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <UiEmptyState
              v-if="!users.length"
              title="No users found"
              description="Try adjusting filters or search."
            />
          </div>

          <div class="space-y-3 lg:hidden">
            <article
              v-for="user in users"
              :key="user.id"
              class="surface-card p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <NuxtLink
                    :to="`/admin/users/${user.id}`"
                    class="font-semibold text-brand-700 hover:underline"
                  >
                    {{ user.fullName }}
                  </NuxtLink>
                  <p class="type-helper mt-0.5 truncate">{{ user.email }}</p>
                </div>
                <UiStatusBadge
                  :tone="user.status === 'active' ? 'success' : 'danger'"
                  compact
                  dot
                >
                  {{ user.status }}
                </UiStatusBadge>
              </div>

              <dl class="mt-3 space-y-2 text-xs">
                <div>
                  <dt class="type-label">Last active</dt>
                  <dd>{{ formatLastActiveLabel(user.lastActiveAt) }}</dd>
                </div>
                <div>
                  <dt class="type-label">Last login</dt>
                  <dd>{{ formatLastLoginLabel(user.lastLoginAt) }}</dd>
                </div>
                <div>
                  <dt class="type-label">Joined</dt>
                  <dd>{{ formatJoinedLabel(user.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="type-label">Resources</dt>
                  <dd>
                    {{ user.counts.farms }} farms ·
                    {{ user.counts.crops }} crops ·
                    {{ user.counts.tasks }} tasks
                  </dd>
                </div>
              </dl>

              <div class="mt-3 flex flex-wrap gap-2">
                <NuxtLink :to="`/admin/users/${user.id}`">
                  <UiAppButton size="sm" variant="secondary">View</UiAppButton>
                </NuxtLink>
                <UiAppButton
                  v-if="canToggleStatus(user)"
                  size="sm"
                  :variant="user.status === 'active' ? 'secondary' : 'primary'"
                  :loading="statusUpdatingId === user.id"
                  @click="toggleStatus(user)"
                >
                  {{ user.status === "active" ? "Disable" : "Re-enable" }}
                </UiAppButton>
                <NuxtLink :to="`/admin/chats?user=${user.id}`">
                  <UiAppButton size="sm" variant="secondary"
                    >Support</UiAppButton
                  >
                </NuxtLink>
              </div>
            </article>
            <UiEmptyState v-if="!users.length" title="No users found" />
          </div>

          <div v-if="hasMore" class="flex justify-center pt-2">
            <UiAppButton
              variant="secondary"
              :loading="loadingMore"
              @click="loadMore"
            >
              Load more
            </UiAppButton>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminUserListItem, AdminUserStats } from "~/types/admin";
import {
  ADMIN_USER_ACTIVITY_FILTER_OPTIONS,
  ADMIN_USER_JOINED_FILTER_OPTIONS,
  ADMIN_USER_SEARCH_HELP,
} from "~/types/admin";
import { adminService } from "~/services/admin.service";
import {
  activityRecencyLabel,
  activityRecencyTone,
  formatAdminDate,
  formatJoinedLabel,
  formatLastActiveLabel,
  formatLastLoginLabel,
} from "~/utils/adminUserFormat";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Users · Admin" });

const DAY_MS = 24 * 60 * 60 * 1000;

const users = ref<AdminUserListItem[]>([]);
const stats = ref<AdminUserStats | null>(null);
const loading = ref(true);
const statsLoading = ref(true);
const loadingMore = ref(false);
const error = ref("");
const search = ref("");
const statusFilter = ref("");
const activityFilter = ref("");
const accountTypeFilter = ref("");
const joinedFilter = ref("");
const cursor = ref<string | null>(null);
const hasMore = ref(false);
const statusUpdatingId = ref<string | null>(null);

const { confirm } = useConfirm();
const toast = useToast();

const hasActiveFilters = computed(() =>
  Boolean(
    search.value.trim() ||
      statusFilter.value ||
      activityFilter.value ||
      accountTypeFilter.value ||
      joinedFilter.value,
  ),
);

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function joinedSinceIso(filter: string): string | undefined {
  if (!filter) return undefined;
  const now = new Date();
  if (filter === "this_month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  if (filter === "30d") {
    return new Date(now.getTime() - 30 * DAY_MS).toISOString();
  }
  if (filter === "90d") {
    return new Date(now.getTime() - 90 * DAY_MS).toISOString();
  }
  return undefined;
}

function canToggleStatus(user: AdminUserListItem): boolean {
  return user.accountType !== "admin";
}

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await adminService.usersStats();
  } catch {
    // Stats are supplementary, list still works without them.
  } finally {
    statsLoading.value = false;
  }
}

async function load(reset = false) {
  if (reset) {
    cursor.value = null;
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  error.value = "";
  try {
    const data = await adminService.listUsers({
      cursor: reset ? undefined : cursor.value || undefined,
      limit: 25,
      search: search.value.trim() || undefined,
      status: statusFilter.value || undefined,
      accountType: accountTypeFilter.value || undefined,
      activity: activityFilter.value || undefined,
      joinedSince: joinedSinceIso(joinedFilter.value),
    });
    users.value = reset ? data.items : [...users.value, ...data.items];
    cursor.value = data.nextCursor;
    hasMore.value = data.hasMore;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to load users";
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function loadMore() {
  void load(false);
}

function clearFilters() {
  search.value = "";
  statusFilter.value = "";
  activityFilter.value = "";
  accountTypeFilter.value = "";
  joinedFilter.value = "";
  void load(true);
}

async function toggleStatus(user: AdminUserListItem) {
  if (!canToggleStatus(user)) return;

  const disabling = user.status === "active";
  const ok = await confirm({
    title: disabling ? "Disable this account?" : "Re-enable this account?",
    message: disabling
      ? `${user.fullName} will be signed out and unable to use Farmingo until re-enabled.`
      : `${user.fullName} will be able to sign in again.`,
    confirmLabel: disabling ? "Disable account" : "Re-enable account",
    destructive: disabling,
  });
  if (!ok) return;

  statusUpdatingId.value = user.id;
  try {
    await adminService.patchUserStatus(
      user.id,
      disabling ? "disabled" : "active",
    );
    const index = users.value.findIndex((row) => row.id === user.id);
    if (index >= 0) {
      users.value[index] = {
        ...users.value[index],
        status: disabling ? "disabled" : "active",
      };
    }
    toast.success(disabling ? "Account disabled" : "Account re-enabled");
    void loadStats();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Unable to update account status",
    );
  } finally {
    statusUpdatingId.value = null;
  }
}

onMounted(() => {
  void loadStats();
  void load(true);
});
</script>

<style scoped>
@media (max-width: 639px) {
  .admin-users-stats {
    display: flex;
    gap: 0.625rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }

  .admin-users-stat-card {
    width: min(72vw, 10.5rem);
    flex-shrink: 0;
  }

  .admin-users-stats::-webkit-scrollbar {
    height: 4px;
  }

  .admin-users-stats::-webkit-scrollbar-thumb {
    background: rgba(26, 77, 46, 0.35);
    border-radius: 999px;
  }
}
</style>
