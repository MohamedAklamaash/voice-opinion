import nodemailer from "nodemailer";
import { Request, Response } from "express";
import { getOtp } from "../controllers/OtpController";
import { UserloginSchema } from "../models/UserLoginModel";
import { UserSchema } from "../models/UserDataModel";
import { createHash } from "./HashService";

const getTransporter = () =>
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SENDER_EMAIL!,
            pass: process.env.SENDER_PASS!,
        },
    });

export const sendMail = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, msg: "Enter Valid Credentials" });
    }
    const otp = getOtp();
    try {
        await getTransporter().sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Use This OTP to sign-in to Voice Your Opinion",
            text: `Your OTP for Voice Your Opinion is: ${otp}`,
        });
        const hashedOtp = createHash(otp);
        const user = await UserloginSchema.findOne({ email });
        if (!user) {
            await UserloginSchema.create({ email, hashedOtp });
        } else {
            user.hashedOtp = hashedOtp;
            await user.save();
        }
        return res.status(200).json({ success: true, msg: "OTP sent successfully" });
    } catch (err) {
        console.error("Mail error:", err);
        return res.status(500).json({ success: false, msg: "Error sending OTP email" });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, msg: "Valid credentials not found" });
    }
    const data = await UserloginSchema.findOne({ email });
    if (!data) {
        return res.status(404).json({ success: false, msg: "User not Found!" });
    }
    const isValidOtp = data.hashedOtp === createHash(otp);
    if (!isValidOtp) {
        return res.status(400).json({ success: false, msg: "OTP is not Valid" });
    }

    // Check if user already has an account
    const existingUser = await UserSchema.findOne({ email, activated: true });
    if (existingUser) {
        return res.status(200).json({
            success: true,
            email,
            existingUser: true,
            name: existingUser.name,
            userProfileUrl: existingUser.userProfileUrl,
        });
    }

    return res.status(200).json({ success: true, email, existingUser: false });
};
