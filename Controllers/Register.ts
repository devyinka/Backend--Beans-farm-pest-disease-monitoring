import { Request, Response } from "express";
import { AUTHSERVICE } from "../Services/Authservice";
import { newUserprops } from "../type/types";

export const Register = async (req: Request, res: Response) => {
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
      firstName,
      lastName,
      email,
      password,
      phone: phoneNumber,
      location: machine_location,
    } as newUserprops);
    const newuser = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phoneNumber,
      location: newUser.machine_location,
      token: newUser.token,
    };

    res
      .status(201)
      .json({ message: "User created successfully", user: newuser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
