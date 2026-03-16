import { Theme } from "../App";
import indianFlag from "../assets/IndianFlag.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

const PhoneComponent = ({ setstepPageCount, stepPageCount }: Props) => {
  const navigate = useNavigate();
  const [phoneNumber, setphoneNumber] = useState("");
  const isValid = /^\d{10}$/.test(phoneNumber);

  const handleNext = () => {
    if (isValid) {
      setstepPageCount(stepPageCount + 1);
      navigate(`/getUrOtp?phoneNumber=${phoneNumber}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center gap-3 px-4 py-3 transition-colors"
        style={{
          background: "var(--ink-2)",
          border: "1px solid var(--ink-4)",
        }}
      >
        <img src={indianFlag} alt="+91" className="w-5 h-5 rounded-sm" />
        <span className="font-mono text-xs" style={{ color: "var(--ash)" }}>+91</span>
        <div className="w-px h-4" style={{ background: "var(--ink-4)" }} />
        <input
          type="tel"
          className="flex-1 bg-transparent font-mono text-sm outline-none"
          style={{ color: "var(--paper)" }}
          onChange={(e) => setphoneNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          placeholder="10-digit number"
          maxLength={10}
        />
      </div>

      {phoneNumber && !isValid && (
        <p className="font-mono text-xs" style={{ color: "var(--danger)" }}>
          INVALID NUMBER
        </p>
      )}

      <button
        className="font-bebas tracking-widest text-lg py-3 transition-all hover:opacity-80 disabled:opacity-30"
        style={{ background: "var(--gold)", color: "var(--ink)" }}
        onClick={handleNext}
        disabled={!isValid}
      >
        SEND OTP →
      </button>

      <p className="font-mono text-xs text-center" style={{ color: "var(--ink-5)" }}>
        By continuing you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  );
};

export default PhoneComponent;
