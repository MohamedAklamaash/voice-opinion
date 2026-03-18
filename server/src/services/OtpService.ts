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
            from: `"Voice Ur Opinion" <${process.env.SENDER_EMAIL}>`,
            to: email,
            subject: "Your OTP for Voice Ur Opinion",
            html: `
                <div style="font-family:monospace;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#f0ebe3;">
                    <h2 style="color:#e8b84b;letter-spacing:4px;font-size:24px;margin:0 0 4px;">VOICE UR OPINION</h2>
                    <p style="color:#888;font-size:12px;letter-spacing:2px;margin:0 0 32px;">— VERIFY YOUR EMAIL —</p>
                    <p style="color:#888;font-size:13px;margin:0 0 16px;">Your one-time passcode:</p>
                    <div style="background:#141414;border:1px solid #2a2a2a;padding:24px;text-align:center;margin-bottom:24px;">
                        <span style="font-size:40px;letter-spacing:12px;color:#e8b84b;font-weight:bold;">${otp}</span>
                    </div>
                    <p style="color:#888;font-size:12px;margin:0 0 8px;">This code expires in <strong style="color:#f0ebe3;">5 minutes</strong>.</p>
                    <p style="color:#3a3a3a;font-size:11px;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
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
