import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { oauthConfig } from "../../config/oauth.config.js";
import { findOrCreateUserFromOAuth } from "../../services/social.service.js";

export default function googleStrategy(passport) {
  const { clientID, clientSecret, callbackURL } = oauthConfig.google;
  if (!clientID || !clientSecret) return;

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;
          const user = await findOrCreateUserFromOAuth({
            provider: "google",
            providerId: profile.id,
            email,
            name,
            avatar,
          });
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}
