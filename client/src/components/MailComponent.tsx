import { Theme } from "../App";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

const MailComponent = ({ setstepPageCount, stepPageCount }: Props) => {
  const [email, setemail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const redirect = new URLSearchParams(window.location.search).get("redirect") || "";

  const handleEmail = async () => {
    if (!email.trim()) { setError("ENTER YOUR EMAIL"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/Otp/send-otp`, { email });
      setstepPageCount(stepPageCount + 1);
      const params = new URLSearchParams({ email });
      if (redirect) params.set("redirect", redirect);
      navigate(`/getUrOtp?${params.toString()}`);
    } catch {
      setError("FAILED TO SEND OTP. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="email"
        onChange={(e) => setemail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleEmail()}
        placeholder="you@example.com"
        className="px-4 py-3 font-mono text-sm outline-none transition-colors"
        style={{
          background: "var(--ink-2)",
          border: "1px solid var(--ink-4)",
          color: "var(--paper)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--ink-4)")}
      />
      {error && (
        <p className="font-mono text-xs" style={{ color: "var(--danger)" }}>{error}</p>
      )}
      <button
        className="font-bebas tracking-widest text-lg py-3 transition-all hover:opacity-80 disabled:opacity-30"
        style={{ background: "var(--gold)", color: "var(--ink)" }}
        onClick={handleEmail}
        disabled={loading}
      >
        {loading ? "SENDING..." : "SEND OTP →"}
      </button>
      <p className="font-mono text-xs text-center" style={{ color: "var(--ink-5)" }}>
        By continuing you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  );
};

export default MailComponent;
