<template>
  <div class="space-y-3 md:space-y-6">
    <UiLoadingState v-if="loading" message="Loading customer profile…" />
    <UiErrorState
      v-else-if="error"
      :message="error"
      retry-label="Back to users"
      @retry="navigateTo('/admin/users')"
    />

    <template v-else-if="detail">
      <header class="surface-card overflow-hidden">
        <div class="border-b border-line bg-canvas/60 px-5 py-4">
          <NuxtLink
            to="/admin/users"
            class="type-label text-brand-700 hover:underline"
          >
            ← All users
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="flex min-w-0 items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-800"
              aria-hidden="true"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-ink">
                {{ detail.user.fullName }}
              </h1>
              <p class="type-body mt-1">{{ detail.user.email }}</p>
              <p v-if="detail.user.phone" class="type-helper mt-1">
                {{ detail.user.phone }}
              </p>
              <p class="type-helper mt-2 font-mono text-xs">
                {{ detail.user.id }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <UiStatusBadge
                  :tone="
                    detail.activity.status === 'active' ? 'success' : 'danger'
                  "
                  dot
                >
                  {{ detail.activity.status }}
                </UiStatusBadge>
                <UiStatusBadge tone="neutral" compact class="capitalize">
                  {{ detail.activity.accountType || "farmer" }}
                </UiStatusBadge>
                <UiStatusBadge
                  :tone="activityRecencyTone(detail.activity.lastActiveAt)"
                  compact
                >
                  {{ activityRecencyLabel(detail.activity.lastActiveAt) }}
                </UiStatusBadge>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-if="detail.conversation"
              :to="`/admin/chats?conversation=${detail.conversation.id}`"
            >
              <UiAppButton size="sm" variant="primary"
                >Open support chat</UiAppButton
              >
            </NuxtLink>
            <NuxtLink v-else :to="`/admin/chats?user=${detail.user.id}`">
              <UiAppButton size="sm" variant="primary"
                >Open support chat</UiAppButton
              >
            </NuxtLink>
            <UiAppButton
              v-if="canToggleStatus"
              size="sm"
              :variant="
                detail.activity.status === 'active' ? 'secondary' : 'primary'
              "
              :loading="statusUpdating"
              @click="toggleStatus"
            >
              {{
                detail.activity.status === "active"
                  ? "Disable account"
                  : "Re-enable account"
              }}
            </UiAppButton>
          </div>
        </div>
      </header>

      <nav
        class="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1 shadow-sm"
        aria-label="Profile sections"
      >
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          class="whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium text-ink-secondary transition hover:bg-canvas hover:text-ink"
        >
          {{ section.label }}
        </a>
      </nav>

      <div class="flex flex-col gap-3 md:gap-6">
        <div
          class="admin-user-detail-stats order-2 grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4 lg:order-1"
        >
          <AdminAdminStatCard
            class="admin-user-detail-stat-card"
            label="Last active"
            :value="formatLastActiveLabel(detail.activity.lastActiveAt)"
          />
          <AdminAdminStatCard
            class="admin-user-detail-stat-card"
            label="Last login"
            :value="formatLastLoginLabel(detail.activity.lastLoginAt)"
          />
          <AdminAdminStatCard
            class="admin-user-detail-stat-card"
            label="Member since"
            :value="formatJoinedLabel(detail.activity.createdAt)"
          />
          <AdminAdminStatCard
            class="admin-user-detail-stat-card"
            label="Account status"
            :value="
              detail.activity.status === 'disabled' ? 'Disabled' : 'Active'
            "
            :helper="
              detail.activity.disabledAt
                ? `Disabled ${formatRelativePast(detail.activity.disabledAt)}`
                : undefined
            "
          />
        </div>

        <div
          class="order-1 grid gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] lg:order-2"
        >
          <div class="space-y-6">
            <section id="profile" class="surface-card p-5">
              <UiSectionHeader
                title="Profile"
                description="Account identity and contact details"
              />
              <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="type-label">Full name</dt>
                  <dd class="mt-1 text-sm">{{ detail.user.fullName }}</dd>
                </div>
                <div>
                  <dt class="type-label">Email</dt>
                  <dd class="mt-1 text-sm">{{ detail.user.email }}</dd>
                </div>
                <div>
                  <dt class="type-label">Phone</dt>
                  <dd class="mt-1 text-sm">{{ detail.user.phone || "-" }}</dd>
                </div>
                <div>
                  <dt class="type-label">Account type</dt>
                  <dd class="mt-1 text-sm capitalize">
                    {{ detail.activity.accountType || "farmer" }}
                  </dd>
                </div>
                <div>
                  <dt class="type-label">User ID</dt>
                  <dd class="mt-1 font-mono text-xs">{{ detail.user.id }}</dd>
                </div>
                <div>
                  <dt class="type-label">Created</dt>
                  <dd class="mt-1 text-sm">
                    {{ formatAdminDateTime(detail.user.createdAt) }}
                    <span class="type-helper block">{{
                      formatJoinedLabel(detail.user.createdAt)
                    }}</span>
                  </dd>
                </div>
              </dl>
            </section>

            <section id="activity" class="surface-card p-5">
              <UiSectionHeader
                title="Activity"
                description="Sign-in, usage, and account status history"
              />
              <ul class="mt-4 space-y-3">
                <li
                  class="flex items-start gap-3 rounded-md border border-line px-3 py-3"
                >
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p class="text-sm font-medium">Last active</p>
                    <p class="type-body">
                      {{ formatLastActiveLabel(detail.activity.lastActiveAt) }}
                    </p>
                    <p v-if="detail.activity.lastActiveAt" class="type-helper">
                      {{ formatAdminDateTime(detail.activity.lastActiveAt) }}
                    </p>
                  </div>
                </li>
                <li
                  class="flex items-start gap-3 rounded-md border border-line px-3 py-3"
                >
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p class="text-sm font-medium">Last login</p>
                    <p class="type-body">
                      {{ formatLastLoginLabel(detail.activity.lastLoginAt) }}
                    </p>
                    <p v-if="detail.activity.lastLoginAt" class="type-helper">
                      {{ formatAdminDateTime(detail.activity.lastLoginAt) }}
                    </p>
                  </div>
                </li>
                <li
                  class="flex items-start gap-3 rounded-md border border-line px-3 py-3"
                >
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink-muted"
                    aria-hidden="true"
                  />
                  <div>
                    <p class="text-sm font-medium">Account created</p>
                    <p class="type-body">
                      {{ formatJoinedLabel(detail.activity.createdAt) }}
                    </p>
                    <p class="type-helper">
                      {{ formatAdminDateTime(detail.activity.createdAt) }}
                    </p>
                  </div>
                </li>
                <li
                  v-if="detail.activity.disabledAt"
                  class="flex items-start gap-3 rounded-md border border-danger/30 bg-danger/5 px-3 py-3"
                >
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full bg-danger"
                    aria-hidden="true"
                  />
                  <div>
                    <p class="text-sm font-medium">Currently disabled</p>
                    <p class="type-body">
                      Since {{ formatRelativePast(detail.activity.disabledAt) }}
                    </p>
                    <p class="type-helper">
                      {{ formatAdminDateTime(detail.activity.disabledAt) }}
                    </p>
                  </div>
                </li>
                <li
                  v-for="event in detail.statusHistory"
                  :key="`${event.action}-${event.createdAt}`"
                  class="flex items-start gap-3 rounded-md border border-line px-3 py-3"
                >
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full"
                    :class="
                      event.action === 'user_disable'
                        ? 'bg-danger'
                        : 'bg-success'
                    "
                    aria-hidden="true"
                  />
                  <div>
                    <p class="text-sm font-medium">
                      {{ statusEventLabel(event.action) }}
                    </p>
                    <p class="type-body">
                      {{ formatRelativePast(event.createdAt) }}
                    </p>
                    <p class="type-helper">
                      {{ formatAdminDateTime(event.createdAt) }} · admin
                      {{ shortId(event.adminId) }}
                    </p>
                  </div>
                </li>
              </ul>
              <p
                v-if="
                  !detail.statusHistory.length && !detail.activity.disabledAt
                "
                class="type-helper mt-4"
              >
                No status change events recorded yet.
              </p>
            </section>

            <section id="farm" class="surface-card p-5">
              <UiSectionHeader
                title="Farm overview"
                description="Primary farm profile and fields"
              />
              <template v-if="detail.farm">
                <dl class="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt class="type-label">Farm name</dt>
                    <dd class="mt-1 text-sm font-medium">
                      {{ detail.farm.name }}
                    </dd>
                  </div>
                  <div>
                    <dt class="type-label">Location</dt>
                    <dd class="mt-1 text-sm">{{ detail.farm.location }}</dd>
                  </div>
                  <div>
                    <dt class="type-label">Size</dt>
                    <dd class="mt-1 text-sm">
                      {{ detail.farm.size }} {{ detail.farm.unit }} ({{
                        detail.farm.totalAreaHa
                      }}
                      ha)
                    </dd>
                  </div>
                  <div>
                    <dt class="type-label">Farming type</dt>
                    <dd class="mt-1 text-sm capitalize">
                      {{ detail.farm.farmingType }}
                    </dd>
                  </div>
                  <div
                    v-if="detail.farm.primaryCrops.length"
                    class="sm:col-span-2"
                  >
                    <dt class="type-label">Primary crops</dt>
                    <dd class="mt-1 text-sm">
                      {{ detail.farm.primaryCrops.join(", ") }}
                    </dd>
                  </div>
                </dl>
                <div class="mt-4 border-t border-line pt-4">
                  <p class="type-label">Fields ({{ detail.fields.length }})</p>
                  <ul
                    v-if="detail.fields.length"
                    class="mt-2 grid gap-2 sm:grid-cols-2"
                  >
                    <li
                      v-for="field in detail.fields.slice(0, 8)"
                      :key="field.id"
                      class="rounded-md border border-line px-3 py-2 text-sm"
                    >
                      <span class="font-medium">{{ field.name }}</span>
                      <span class="type-helper">
                        · {{ field.area }} {{ field.areaUnit || "ha" }}</span
                      >
                    </li>
                  </ul>
                  <p v-if="detail.fields.length > 8" class="type-helper mt-2">
                    + {{ detail.fields.length - 8 }} more fields
                  </p>
                  <UiEmptyState
                    v-else-if="!detail.fields.length"
                    title="No fields registered"
                  />
                </div>
              </template>
              <UiEmptyState
                v-else
                title="No farm profile"
                description="This user has not completed farm setup."
              />
            </section>

            <section id="crops" class="surface-card p-5">
              <UiSectionHeader
                title="Crops"
                :description="`${detail.crops.length} active crop records`"
              />
              <ul v-if="detail.crops.length" class="mt-4 space-y-2">
                <li
                  v-for="crop in detail.crops.slice(0, 12)"
                  :key="crop.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm"
                >
                  <div>
                    <span class="font-medium">{{ crop.name }}</span>
                    <span class="type-helper"> · {{ crop.fieldName }}</span>
                  </div>
                  <UiStatusBadge
                    :tone="
                      crop.healthScore >= 70
                        ? 'success'
                        : crop.healthScore >= 40
                          ? 'warning'
                          : 'danger'
                    "
                    compact
                  >
                    {{ crop.healthScore }}% health
                  </UiStatusBadge>
                </li>
              </ul>
              <p v-if="detail.crops.length > 12" class="type-helper mt-3">
                + {{ detail.crops.length - 12 }} more crops
              </p>
              <UiEmptyState v-else-if="!detail.crops.length" title="No crops" />
            </section>

            <section id="yield" class="surface-card p-5">
              <UiSectionHeader
                title="Yield"
                :description="`${detail.summaries.yields.total} records · ${detail.summaries.yields.expectedTotal} expected · ${detail.summaries.yields.actualTotal} actual`"
              />
              <ul v-if="detail.yields.length" class="mt-4 space-y-2">
                <li
                  v-for="record in detail.yields.slice(0, 10)"
                  :key="record.id"
                  class="rounded-md border border-line px-3 py-2 text-sm"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span class="font-medium"
                      >{{ record.cropName }} · {{ record.fieldName }}</span
                    >
                    <span class="type-helper"
                      >{{ record.season }} {{ record.year }}</span
                    >
                  </div>
                  <p class="type-helper mt-1">
                    Expected {{ record.expectedYield }} · Actual
                    {{ record.actualYield }}
                    {{ record.yieldUnit }}
                  </p>
                </li>
              </ul>
              <UiEmptyState v-else title="No yield records" />
            </section>

            <section id="tasks" class="surface-card p-5">
              <UiSectionHeader
                title="Tasks"
                :description="`${detail.summaries.tasks.open} open · ${detail.summaries.tasks.completed} completed`"
              />
              <ul v-if="detail.tasks.length" class="mt-4 space-y-2">
                <li
                  v-for="task in detail.tasks.slice(0, 10)"
                  :key="task.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm"
                >
                  <div class="min-w-0">
                    <p class="font-medium">{{ task.title }}</p>
                    <p class="type-helper">
                      {{ task.crop }} · {{ task.field }}
                    </p>
                  </div>
                  <UiStatusBadge :tone="taskStatusTone(task.status)" compact>
                    {{ task.status.replace("_", " ") }}
                  </UiStatusBadge>
                </li>
              </ul>
              <UiEmptyState v-else title="No tasks" />
            </section>

            <section id="disease" class="surface-card p-5">
              <UiSectionHeader
                title="Disease"
                :description="`${detail.summaries.diseaseAssessments.total} assessments`"
              />
              <ul
                v-if="detail.diseaseAssessments.length"
                class="mt-4 space-y-2"
              >
                <li
                  v-for="assessment in detail.diseaseAssessments.slice(0, 10)"
                  :key="assessment.id"
                  class="rounded-md border border-line px-3 py-2 text-sm"
                >
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span class="font-medium">{{
                      assessment.possibleDisease
                    }}</span>
                    <UiStatusBadge tone="warning" compact>{{
                      assessment.severity
                    }}</UiStatusBadge>
                  </div>
                  <p class="type-helper mt-1">
                    {{ assessment.cropName || "Unknown crop" }}
                    <span v-if="assessment.fieldName">
                      · {{ assessment.fieldName }}</span
                    >
                    · {{ formatRelativePast(assessment.createdAt) }}
                  </p>
                </li>
              </ul>
              <UiEmptyState v-else title="No disease assessments" />
            </section>

            <section id="treatment" class="surface-card p-5">
              <UiSectionHeader
                title="Treatment plans"
                :description="`${detail.summaries.treatmentPlans.total} plans`"
              />
              <ul v-if="detail.treatmentPlans.length" class="mt-4 space-y-2">
                <li
                  v-for="plan in detail.treatmentPlans.slice(0, 10)"
                  :key="plan.id"
                  class="rounded-md border border-line px-3 py-2 text-sm"
                >
                  <p class="font-medium">{{ plan.title }}</p>
                  <p class="type-helper mt-1">
                    {{ plan.cropName }} · {{ plan.problemName }} ·
                    {{ formatRelativePast(plan.createdAt) }}
                  </p>
                </li>
              </ul>
              <UiEmptyState v-else title="No treatment plans" />
            </section>
          </div>

          <aside
            id="support"
            class="space-y-4 xl:sticky xl:top-16 xl:self-start"
          >
            <section class="surface-card p-4">
              <UiSectionHeader
                title="Support conversations"
                description="Current and archived threads"
              />
              <ul v-if="detail.conversations.length" class="mt-3 space-y-2">
                <li
                  v-for="conversation in detail.conversations"
                  :key="conversation.id"
                  class="rounded-md border border-line p-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-medium">
                        {{
                          conversation.isCurrent
                            ? "Current thread"
                            : "Archived thread"
                        }}
                      </p>
                      <p class="type-helper mt-0.5 truncate">
                        {{ conversation.lastMessageText || "No messages yet" }}
                      </p>
                    </div>
                    <span
                      v-if="conversation.unreadCountAdmin > 0"
                      class="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white"
                    >
                      {{ conversation.unreadCountAdmin }}
                    </span>
                  </div>
                  <div
                    class="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-ink-muted"
                  >
                    <UiStatusBadge tone="neutral" compact>{{
                      conversation.status
                    }}</UiStatusBadge>
                    <span>{{
                      formatRelativePast(conversation.lastMessageAt)
                    }}</span>
                  </div>
                  <NuxtLink
                    :to="`/admin/chats?conversation=${conversation.id}`"
                    class="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline"
                  >
                    Open conversation
                  </NuxtLink>
                </li>
              </ul>
              <UiEmptyState
                v-else
                title="No conversations"
                description="Start a support thread from the inbox."
              />
              <NuxtLink
                :to="`/admin/chats?user=${detail.user.id}`"
                class="mt-3 block"
              >
                <UiAppButton size="sm" variant="secondary" class="w-full"
                  >Open in inbox</UiAppButton
                >
              </NuxtLink>
            </section>

            <section class="surface-card p-4">
              <UiSectionHeader title="At a glance" />
              <dl class="mt-3 space-y-3 text-sm">
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Farms</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.farm ? 1 : 0 }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Fields</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.fields.total }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Crops</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.crops.total }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Open tasks</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.tasks.open }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Yield records</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.yields.total }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Disease assessments</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.diseaseAssessments.total }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="type-label">Treatment plans</dt>
                  <dd class="font-semibold tabular-nums">
                    {{ detail.summaries.treatmentPlans.total }}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminUserDetail } from "~/types/admin";
import type { WorkTask } from "~/types/task";
import { adminService } from "~/services/admin.service";
import {
  activityRecencyLabel,
  activityRecencyTone,
  formatAdminDateTime,
  formatJoinedLabel,
  formatLastActiveLabel,
  formatLastLoginLabel,
  formatRelativePast,
  statusEventLabel,
} from "~/utils/adminUserFormat";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });

const route = useRoute();
const uid = computed(() => String(route.params.uid || ""));
const { confirm } = useConfirm();
const toast = useToast();

const loading = ref(true);
const statusUpdating = ref(false);
const error = ref("");
const detail = ref<AdminUserDetail | null>(null);

const sections = [
  { id: "profile", label: "Profile" },
  { id: "activity", label: "Activity" },
  { id: "farm", label: "Farm" },
  { id: "crops", label: "Crops" },
  { id: "yield", label: "Yield" },
  { id: "tasks", label: "Tasks" },
  { id: "disease", label: "Disease" },
  { id: "treatment", label: "Treatment" },
  { id: "support", label: "Support" },
];

const canToggleStatus = computed(
  () => detail.value?.activity.accountType !== "admin",
);

const initials = computed(() => {
  const name = detail.value?.user.fullName.trim() || "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
});

useHead(() => ({
  title: detail.value
    ? `${detail.value.user.fullName} · Users`
    : "User profile · Admin",
}));

function shortId(value: string): string {
  return value.length > 10 ? `${value.slice(0, 8)}…` : value;
}

function taskStatusTone(
  status: WorkTask["status"],
): "success" | "warning" | "neutral" | "danger" {
  if (status === "completed") return "success";
  if (status === "overdue") return "danger";
  if (status === "in_progress") return "warning";
  return "neutral";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    detail.value = await adminService.getUser(uid.value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to load user";
  } finally {
    loading.value = false;
  }
}

async function toggleStatus() {
  if (!detail.value || !canToggleStatus.value) return;

  const disabling = detail.value.activity.status === "active";
  const ok = await confirm({
    title: disabling ? "Disable this account?" : "Re-enable this account?",
    message: disabling
      ? `${detail.value.user.fullName} will be signed out and unable to use Farmingo until re-enabled.`
      : `${detail.value.user.fullName} will be able to sign in again.`,
    confirmLabel: disabling ? "Disable account" : "Re-enable account",
    destructive: disabling,
  });
  if (!ok) return;

  statusUpdating.value = true;
  try {
    const activity = await adminService.patchUserStatus(
      detail.value.user.id,
      disabling ? "disabled" : "active",
    );
    detail.value = { ...detail.value, activity };
    // Refresh status history after server-side audit log write.
    const refreshed = await adminService.getUser(uid.value);
    detail.value = refreshed;
    toast.success(disabling ? "Account disabled" : "Account re-enabled");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Unable to update account status",
    );
  } finally {
    statusUpdating.value = false;
  }
}

watch(uid, load, { immediate: true });
</script>

<style scoped>
@media (max-width: 639px) {
  .admin-user-detail-stats {
    display: flex;
    gap: 0.625rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }

  .admin-user-detail-stat-card {
    width: min(72vw, 10.5rem);
    flex-shrink: 0;
  }

  .admin-user-detail-stats::-webkit-scrollbar {
    height: 4px;
  }

  .admin-user-detail-stats::-webkit-scrollbar-thumb {
    background: rgba(26, 77, 46, 0.35);
    border-radius: 999px;
  }
}
</style>
