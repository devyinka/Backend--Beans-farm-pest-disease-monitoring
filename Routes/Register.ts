import { Router } from "express";
import { Register } from "../Controllers/Register";

const registerRouter = Router();

registerRouter.post("/register", Register);

export default registerRouter;
