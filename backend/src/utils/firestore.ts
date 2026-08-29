import type {
  DocumentData,
  DocumentSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";

export const COLLECTIONS = {
  users: "users",
  farms: "farms",
  fields: "fields",
  crops: "crops",
  yieldRecords: "yieldRecords",
  tasks: "tasks",
  treatmentPlans: "treatmentPlans",
  notifications: "notifications",
  diseaseAssessments: "diseaseAssessments",
  supportConversations: "supportConversations",
  admins: "admins",
  adminAuditLogs: "adminAuditLogs",
} as const;

/** Remove undefined values, Firestore rejects undefined fields. */
export function stripUndefined<T extends Record<string, unknown>>(
  data: T,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<T>;
}

function serializeValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (
    typeof value === "object" &&
    value !== null &&
    "_seconds" in value &&
    "_nanoseconds" in value
  ) {
    const ts = value as { _seconds: number; _nanoseconds: number };
    return new Date(
      ts._seconds * 1000 + ts._nanoseconds / 1_000_000,
    ).toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object" && value !== null) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const serialized = serializeValue(v);
      if (serialized !== undefined) obj[k] = serialized;
    }
    return obj;
  }
  return value;
}

export function docToRecord<T extends { id: string }>(
  snap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): T {
  const data = serializeValue(snap.data()) as Record<string, unknown>;
  return { id: snap.id, ...data } as T;
}

export function converter<
  T extends { id: string },
>(): FirestoreDataConverter<T> {
  return {
    toFirestore(record: T): DocumentData {
      const { id: _id, ...rest } = record;
      return stripUndefined(rest as Record<string, unknown>) as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot): T {
      return docToRecord<T>(snap);
    },
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}
