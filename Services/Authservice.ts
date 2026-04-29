import jwt from "jsonwebtoken";
import crypto from "crypto";
import { hashPassword } from "../helper/password";
import { comparePassword } from "../helper/password";

import type { login, signup } from "../type/types";
import Register from "../Models/Register";

const SALT_ROUNDS = 10;

const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined.");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "7d") as jwt.SignOptions["expiresIn"],
  });
};

export const AUTHSERVICE = {
  signup: async ({
    email,
    firstName,
    lastName,
    phone,
    location,
    password,
  }: signup): Promise<any> => {
    const existingUser = await Register.findOne({ email });
    if (existingUser) {
      throw new Error(`User with email ${email} already exists.`);
    }
    const newUser = new Register({
      email,
      firstName,
      lastName,
      phoneNumber: Number(phone),
      machine_location: location,
      token: signToken(crypto.randomBytes(16).toString("hex")),
      password: await hashPassword(password),
    });
    await newUser.save();
    return newUser;
  },

  login: async ({ email, password }: login) => {
    const user = await Register.findOne({ email });
    if (!user) {
      throw new Error(`User with email ${email} not found.`);
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error(`Invalid password for user with email ${email}.`);
    }
    return user;
  },

  forgetPassword: async (email: string) => {
    throw new Error(`Password reset is not wired yet for ${email}.`);
  },

  verifyToken: async (token: string) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined.");
    }

    try {
      const decoded = jwt.verify(token, secret) as { userId?: string };

      if (!decoded.userId) {
        throw new Error("Invalid token payload.");
      }

      return { id: decoded.userId };
    } catch {
      throw new Error("Invalid token.");
    }
  },

  ResetPassword: async (
    _token: string,
    _newPassword: string,
  ): Promise<boolean> => {
    throw new Error("Reset password is not wired yet.");
  },

  changePassword: async (
    _userId: string,
    _newPassword: string,
  ): Promise<boolean> => {
    throw new Error("Change password is not wired yet.");
  },
  getMe: async (userId: string) => {
    return { id: userId };
  },
};
