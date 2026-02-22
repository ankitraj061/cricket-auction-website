import { Router } from "express";
import { userLogin,adminLogin , adminRegister, userRegister, logout,checkAuth} from "../controller/auth.controller.js";

const authRouter = Router();

authRouter.post("/user/login", userLogin);
authRouter.post("/admin/login", adminLogin);
authRouter.post("/admin/register", adminRegister);
authRouter.post("/user/register", userRegister);
authRouter.get("/me", checkAuth);
authRouter.post("/logout", logout);


export default authRouter;