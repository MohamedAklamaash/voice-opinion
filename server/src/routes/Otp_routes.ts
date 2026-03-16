import express, { Router } from "express";
import { sendMail, verifyOtp } from "../services/OtpService";

const router: Router = express.Router();

router.route("/send-otp").post(sendMail);
router.route("/verify-otp").post(verifyOtp);

export default router;