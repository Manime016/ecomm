import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
} from "../controller/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);

export default router;
