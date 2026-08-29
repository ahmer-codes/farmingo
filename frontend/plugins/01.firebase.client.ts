import { setAuthTokenGetter } from "~/services/authToken";
import { getFirebaseIdToken } from "~/lib/firebase";

/** Must run before auth.client.ts (01 prefix). */
export default defineNuxtPlugin(() => {
  setAuthTokenGetter(() => getFirebaseIdToken());
});
