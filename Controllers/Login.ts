import { AUTHSERVICE } from "../Services/Authservice";
import { login } from "../type/types";
import { Request, Response, NextFunction } from "express";

export const LogIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = req.body as Partial<login> & {
    loginUser?: string;
    username?: string;
  };

  const email = body.email ?? body.loginUser ?? body.username;
  const { password, machine_location } = body;

  if (!email || !password || !machine_location) {
    res.status(400).json({
      message: "Email, password, and machine location are required.",
    });
    return;
  }

  try {
    const user = await AUTHSERVICE.signin({
      email,
      password,
      machine_location,
    });
    res.status(200).json({ message: "Login successful", data: user });
  } catch (error) {
    next(error);
  }
};
