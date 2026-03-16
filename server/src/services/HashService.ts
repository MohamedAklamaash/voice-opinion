import crypto from "crypto";

export const createHash = (otp: string): string => {
    return crypto.createHmac("sha256", process.env.HASH_SECRET!)
        .update(otp, "utf8")
        .digest("base64");
}

