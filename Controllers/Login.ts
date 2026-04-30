import { AUTHSERVICE } from "../Services/Authservice";
import { login } from "../type/types";
import { Request, Response, NextFunction } from "express";

export const LogIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password, machine_location } = req.body as login;
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
