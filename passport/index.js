import passport from "passport";
import googleStrategy from "./strategies/google.js";
import microsoftStrategy from "./strategies/microsoft.js";
import appleStrategy from "./strategies/apple.js";

export function initPassport() {
  googleStrategy(passport);
  microsoftStrategy(passport);
  appleStrategy(passport);
  return passport;
}
