
export const getOtp = (): string => {
    const otpLength: number = 4;
    const allowedCharacters: string = "0123456789";
    let otp: string = "";
    for (let i: number = 0; i < otpLength; i++) {
        const index: number = Math.floor(Math.random() * allowedCharacters.length);
        const randomChar: string = allowedCharacters.charAt(index);
        otp += randomChar;
    }
    return otp;
}

