import jwt from "jsonwebtoken";
import { hashPassword } from "../helper/password";
import { comparePassword } from "../helper/password";
import type { login, signup } from "../type/types";
import type { userdata } from "../type/types";
import Register from "../Models/Register";

const signToken = (userId: any): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined.");
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "7d") as jwt.SignOptions["expiresIn"],
  });
};

//all the Authentication realated service
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
      phoneNumber: phone,
      machine_location: location,
      password: await hashPassword(password),
    });
    await newUser.save();
    newUser.token = signToken(newUser._id);
    await newUser.save();

    const userdata = {
      email,
      firstName,
      lastName,
      machine_location: location,
      token: newUser.token,
    };
    return userdata;
  },

  signin: async ({
    email,
    password,
    machine_location,
  }: login): Promise<userdata> => {
    const user = await Register.findOne({ email });
    if (!user) {
      throw new Error(`User with email ${email} not found.`);
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error(`Invalid password for user with email ${email}.`);
    }
    const token = signToken(user._id);
    user.token = token;
    await user.save();
    const userdata: userdata = {
      email,
      machine_location: user.machine_location ?? machine_location,
      token,
    };
    return userdata;
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

  getPhoneNumberByLocation: async (
    location: string,
  ): Promise<string | null> => {
    const user = await Register.findOne({ machine_location: location });
    return user?.phoneNumber || null;
  },
};
