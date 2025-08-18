import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { oauthConfig } from "../../config/oauth.config.js";
import { findOrCreateUserFromOAuth } from "../../services/social.service.js";

export default function microsoftStrategy(passport) {
  const { clientID, clientSecret, callbackURL, scope } = oauthConfig.microsoft;
  if (!clientID || !clientSecret) return;

  passport.use(
    new MicrosoftStrategy(
      { clientID, clientSecret, callbackURL, scope },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails?.[0]?.value || profile._json?.userPrincipalName;
          const name = profile.displayName || profile._json?.displayName;
          const user = await findOrCreateUserFromOAuth({
            provider: "microsoft",
            providerId: profile.id,
            email,
            name,
            avatar: "",
          });
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}