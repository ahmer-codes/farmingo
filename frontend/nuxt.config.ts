// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "tailwind.config.ts",
  },

  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api",
      appName: "Farmingo",
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || "",
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      firebaseStorageBucket:
        process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || "",
    },
  },

  app: {
    head: {
      title: "Farmingo",
      titleTemplate: "%s · Farmingo",
      meta: [
        {
          name: "description",
          content: "Farmingo, your farm monitoring and crop health assistant.",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
        },
      ],
    },
  },

  routeRules: {
    "/dashboard/**": { ssr: false },
    "/farm/**": { ssr: false },
    "/crops/**": { ssr: false },
    "/disease-detection/**": { ssr: false },
    "/tasks/**": { ssr: false },
    "/weather/**": { ssr: false },
    "/yield/**": { ssr: false },
    "/notifications/**": { ssr: false },
    "/profile/**": { ssr: false },
    "/settings/**": { ssr: false },
    "/crop-health/**": { ssr: false },
    "/disease": { ssr: false },
    "/admin/**": { ssr: false },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
});
