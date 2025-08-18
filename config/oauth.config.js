export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/oauth/google/callback",
  },
  microsoft: {
    clientID: process.env.MS_CLIENT_ID || "",
    clientSecret: process.env.MS_CLIENT_SECRET || "",
    callbackURL:
      process.env.MS_CALLBACK_URL ||
      "http://localhost:3000/api/auth/oauth/microsoft/callback",
    scope: ["user.read"],
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID || "",
    teamID: process.env.APPLE_TEAM_ID || "",
    keyID: process.env.APPLE_KEY_ID || "",
    privateKey: (process.env.APPLE_PRIVATE_KEY || "").split("\\n").join("\n"),
    callbackURL:
      process.env.APPLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/oauth/apple/callback",
    scope: ["name", "email"],
  },
  successRedirect:
    process.env.AUTH_SUCCESS_REDIRECT || "http://localhost:3001/oauth/callback",
};
