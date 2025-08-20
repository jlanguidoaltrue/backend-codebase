import mongoose from "mongoose";
import slugify from "slugify";

const RESERVED_SLUGS = new Set(["admin", "api", "www", "root", "system"]);
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/; // 2–64 chars

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
      validate: [
        {
          validator: (v) => slugPattern.test(v),
          message:
            "Slug must be 2–64 chars, lowercase a–z/0–9 with hyphens, no leading/trailing hyphen.",
        },
        {
          validator: (v) => !RESERVED_SLUGS.has(v),
          message: "Slug is reserved.",
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

TenantSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const MODEL_NAME = "Tenant";
export default mongoose.models[MODEL_NAME] ||
  mongoose.model(MODEL_NAME, TenantSchema);
