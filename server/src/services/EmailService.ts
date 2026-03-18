import nodemailer from "nodemailer";

const getTransporter = () =>
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SENDER_EMAIL!,
            pass: process.env.SENDER_PASS!,
        },
    });

export const sendRoomInviteEmail = async (
    toEmail: string,
    roomTitle: string,
    roomId: string,
    inviterName: string
): Promise<void> => {
    const joinLink = `${process.env.CLIENT_URL}/room/${roomId}`;
    const transporter = getTransporter();
    const info = await transporter.sendMail({
        from: `"Voice Ur Opinion" <${process.env.SENDER_EMAIL}>`,
        to: toEmail,
        subject: `${inviterName} invited you to "${roomTitle}" on Voice Ur Opinion`,
        html: `
            <div style="font-family:monospace;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#f0ebe3;">
                <h2 style="color:#e8b84b;letter-spacing:4px;font-size:24px;">VOICE UR OPINION</h2>
                <p style="color:#888;font-size:12px;letter-spacing:2px;">— YOU'VE BEEN INVITED —</p>
                <p style="margin:24px 0 8px;"><strong>${inviterName}</strong> invited you to join a live room:</p>
                <h3 style="color:#e8b84b;font-size:20px;margin:0 0 24px;">"${roomTitle}"</h3>
                <p style="color:#888;font-size:12px;margin-bottom:24px;">
                    If you don't have an account yet, you'll be asked to sign up with your email and OTP first — it only takes a minute.
                </p>
                <a href="${joinLink}" style="display:inline-block;background:#e8b84b;color:#0a0a0a;padding:12px 28px;text-decoration:none;font-weight:bold;letter-spacing:2px;font-size:14px;">
                    JOIN ROOM →
                </a>
                <p style="color:#3a3a3a;font-size:11px;margin-top:32px;">If you didn't expect this, you can ignore this email.</p>
            </div>
        `,
    });
    console.log(`[invite email] sent to ${toEmail} — messageId: ${info.messageId}`);
};
