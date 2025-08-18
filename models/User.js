import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const IdentitySchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["google", "microsoft", "apple"],
      required: true,
    },
    providerId: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // ⬇️ Conditional required: local accounts need a phone; OAuth accounts can add it later
    phone: {
      type: String,
      trim: true,
      required: function () {
        return !(this.identities && this.identities.length); // required only if no social identities
      },
    },

    // ⬇️ Conditional required: local accounts need a password; OAuth accounts do not
    password: {
      type: String,
      // don't set `required: true` globally
      default: undefined,
    },

    avatar: { type: String, default: "" },
    info: { type: Object, default: {} },
    preferences: { type: Object, default: {} },
    isAdmin: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    mfa: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ["email", "totp", "sms"],
        default: undefined,
      },
      secret: { type: String, default: undefined },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    identities: { type: [IdentitySchema], default: [] },

    // helpful flag so FE can route to /profile after SSO
    needsOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.virtual("avatarUrl")
  .get(function () {
    return this.avatar;
  })
  .set(function (v) {
    this.avatar = v || "";
  });

UserSchema.index(
  { "identities.provider": 1, "identities.providerId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "identities.provider": { $exists: true, $type: "string" },
      "identities.providerId": { $exists: true, $type: "string" },
    },
  }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("email") && this.email)
    this.email = String(this.email).trim().toLowerCase();
  if (this.isModified("username") && this.username)
    this.username = String(this.username).trim().toLowerCase();

  // Hash password iff it’s provided/changed
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.verifyPassword = function (plain) {
  if (!this.password) return false; // OAuth-only user has no local password
  return bcrypt.compare(plain, this.password);
};

UserSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.mfa?.secret;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", UserSchema);
export default User;
