import Joi from "joi";
import { passwordRegex, passwordRule } from "../utils/passwordComplexity.js";
import {
  USERNAME_MIN,
  USERNAME_MAX,
  PHONE_MIN,
  PHONE_MAX,
  PHONE_REGEX,
} from "../constants/userLimits.js";

export const loginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string()
      .trim()
      .min(USERNAME_MIN)
      .max(USERNAME_MAX)
      .required(),
    email: Joi.string().trim().lowercase().email(),
    password: Joi.string().min(1).required(), // no complexity at login
  })
    .xor("username", "email")
    .required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().min(20).required(),
  }),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const registerSchema = Joi.object({
  body: Joi.object({
    username: Joi.string()
      .trim()
      .min(USERNAME_MIN)
      .max(USERNAME_MAX)
      .required(),
    email: Joi.string().trim().lowercase().email().required(),
    phone: Joi.string()
      .trim()
      .min(PHONE_MIN)
      .max(PHONE_MAX)
      .pattern(PHONE_REGEX)
      .required()
      .messages({
        "string.pattern.base":
          "Phone must be digits (optionally starting with +) and 7–15 long.",
      }),
    password: Joi.string()
      .regex(passwordRegex)
      .required()
      .messages({
        "string.pattern.base": `Password does not meet complexity requirements. ${passwordRule}`,
      }),
  }),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});
