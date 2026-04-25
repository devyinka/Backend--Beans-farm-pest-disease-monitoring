import jwt from "jsonwebtoken";
import type { login, signup } from "../type/types";

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
  }: signup) => {
    throw new Error(`Signup is not wired yet for ${email}.`);
  },

  login: async ({ email, password }: login) => {
    throw new Error(`Login is not wired yet for ${email}.`);
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
