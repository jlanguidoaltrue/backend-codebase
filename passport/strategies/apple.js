import { Strategy as AppleStrategy } from "passport-apple";
import { oauthConfig } from "../../config/oauth.config.js";
import { findOrCreateUserFromOAuth } from "../../services/social.service.js";

export default function appleStrategy(passport) {
  const { clientID, teamID, keyID, privateKey, callbackURL, scope } =
    oauthConfig.apple;

  if (!clientID || !teamID || !keyID || !privateKey) return;

  passport.use(
    new AppleStrategy(
      {
        clientID,
        teamID,
        keyID,
        key: privateKey,
        callbackURL,
        scope,
      },
      async (_accessToken, _refreshToken, _idToken, profile, done) => {
        try {
          const email = profile.email;
          const name = [profile.name?.firstName, profile.name?.lastName]
            .filter(Boolean)
            .join(" ");
          const user = await findOrCreateUserFromOAuth({
            provider: "apple",
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
