import { Request, Response, NextFunction } from "express";
import { AUTHSERVICE } from "../Services/Authservice";
import { newUserprops } from "../type/types";

export const Register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    machine_location,
  } = req.body;
  try {
    const newUser = await AUTHSERVICE.signup({
      email,
      firstName,
      lastName,
      phone: phoneNumber,
      location: machine_location,
      password,
    } as newUserprops);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    next(error);
  }
};
