import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setEmail, setPhoneNumber, setUserName, setProfileUrl } from "../store/UserSlice";
import axios from "axios";
import { Theme } from "../App";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

const GetOtpPage: React.FC<Props> = ({ setstepPageCount, stepPageCount }: Props) => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const phoneNumber = urlParams.get("phoneNumber");
  const email = urlParams.get("email");
  const dispatch = useDispatch();
  dispatch(setPhoneNumber(phoneNumber));

  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpInputs = useRef<HTMLInputElement[]>([]);

  const VerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 4) { setError("Enter all 4 digits"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<{
        success: boolean;
        email: string;
        existingUser: boolean;
        name?: string;
        userProfileUrl?: string;
      }>(`${import.meta.env.VITE_API_URL}/Otp/verify-otp`, { email, otp: otpStr });

      if (!data.success) { setError("Invalid OTP. Please try again."); setLoading(false); return; }

      dispatch(setEmail(email));

      if (data.existingUser && data.name) {
        // Returning user — skip name/photo screens, go straight to home
        dispatch(setUserName(data.name));
        if (data.userProfileUrl) dispatch(setProfileUrl(data.userProfileUrl));
        navigate("/home");
        return;
      }

      setstepPageCount(stepPageCount + 1);
      navigate("/enterName");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/, "");
    if (!value) return;
    const newOtp = [...otp];
    newOtp[index] = value[value.length - 1];
    setOtp(newOtp);
    if (index < 3) otpInputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      if (index > 0) otpInputs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") VerifyOtp();
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-sm text-center">
        <span className="text-5xl">📬</span>
        <h1 className="text-2xl font-bold font-montserrat mt-4 mb-1">Check your inbox</h1>
        <p className="text-secondary-white text-sm font-poppins mb-8">
          We sent a 4-digit OTP to <span className="text-white font-semibold">{email || phoneNumber}</span>
        </p>
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              value={digit}
              maxLength={1}
              className="w-14 h-14 bg-secondary-black-600 text-white text-2xl font-bold text-center rounded-xl border-2 border-primary-black-400 focus:border-primary-indigo outline-none transition-colors"
              onChange={handleOtpChange(index)}
              onKeyDown={handleKeyDown(index)}
              ref={(input) => { if (input) otpInputs.current[index] = input; }}
            />
          ))}
        </div>
        {error && <p className="text-red-400 text-sm font-poppins mb-4">{error}</p>}
        <button
          className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-4 font-montserrat font-bold text-lg disabled:opacity-50"
          onClick={VerifyOtp}
          disabled={loading || otp.join("").length < 4}
        >
          {loading ? "Verifying..." : "Verify OTP →"}
        </button>
        <button
          className="mt-4 text-secondary-white text-sm font-poppins hover:text-white"
          onClick={() => navigate("/signIn")}
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  );
};

export default GetOtpPage;
