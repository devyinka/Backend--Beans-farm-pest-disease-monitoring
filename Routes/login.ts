import { Router } from "express";
import { LogIn } from "../Controllers/Login";

const loginRouter = Router();

loginRouter.post("/login", LogIn);

export default loginRouter;
