import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
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
  useEffect(() => { dispatch(setPhoneNumber(phoneNumber)); }, []);

  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpInputs = useRef<HTMLInputElement[]>([]);

  const VerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 4) { setError("ENTER ALL 4 DIGITS"); return; }
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

      if (!data.success) { setError("INVALID OTP. TRY AGAIN."); setLoading(false); return; }
      dispatch(setEmail(email));
      if (data.existingUser && data.name) {
        dispatch(setUserName(data.name));
        if (data.userProfileUrl) dispatch(setProfileUrl(data.userProfileUrl));
        navigate("/home");
        return;
      }
      setstepPageCount(stepPageCount + 1);
      navigate("/enterName");
    } catch {
      setError("SOMETHING WENT WRONG.");
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
    <div className="flex-1 flex items-center justify-center px-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-[280px] mx-auto anim-fade-up">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
          — STEP 02 / VERIFY —
        </p>
        <h1 className="font-bebas text-6xl leading-none mb-1" style={{ color: "var(--paper)" }}>
          CHECK YOUR
        </h1>
        <h2 className="font-bebas text-6xl leading-none mb-3" style={{ color: "var(--gold)" }}>
          INBOX.
        </h2>
        <p className="font-mono text-xs mb-8" style={{ color: "var(--ash)" }}>
          4-digit code sent to{" "}
          <span style={{ color: "var(--paper)" }}>{email || phoneNumber}</span>
        </p>

        {/* OTP inputs */}
        <div className="flex gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              value={digit}
              maxLength={1}
              className="flex-1 h-16 font-bebas text-3xl text-center outline-none transition-colors"
              style={{
                background: "var(--ink-2)",
                border: `1px solid ${digit ? "var(--gold)" : "var(--ink-4)"}`,
                color: "var(--paper)",
              }}
              onChange={handleOtpChange(index)}
              onKeyDown={handleKeyDown(index)}
              ref={(input) => { if (input) otpInputs.current[index] = input; }}
            />
          ))}
        </div>

        {error && (
          <p className="font-mono text-xs mb-4" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        <button
          className="w-full font-bebas tracking-widest text-lg py-3 mb-4 transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
          onClick={VerifyOtp}
          disabled={loading || otp.join("").length < 4}
        >
          {loading ? "VERIFYING..." : "VERIFY →"}
        </button>

        <button
          className="font-mono text-xs tracking-widest hover:opacity-70"
          style={{ color: "var(--ash)" }}
          onClick={() => navigate("/signIn")}
        >
          ← BACK
        </button>
      </div>
    </div>
  );
};

export default GetOtpPage;
