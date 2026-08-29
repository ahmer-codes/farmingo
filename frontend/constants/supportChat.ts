/** Stable id for welcome message, must match backend and must not use reserved `__...__`. */
export const SYSTEM_GREETING_ID = "farmingo-system-greeting";
export const OPTIMISTIC_MESSAGE_PREFIX = "__optimistic__";
/** Max messages kept in Firestore realtime listeners, older history via REST pagination. */
export const REALTIME_MESSAGE_LIMIT = 100;

export const SUPPORT_WELCOME_TITLE = "Hi! 👋 Welcome to Farmingo Support.";
export const SUPPORT_WELCOME_SUBTITLE =
  "How can we help you today? Message us anytime, we typically reply within a few hours.";

export const SUPPORT_QUICK_PROMPTS = [
  "I need help with my crops",
  "I have a disease detection question",
  "I need help with my yield data",
  "I need technical support",
] as const;
