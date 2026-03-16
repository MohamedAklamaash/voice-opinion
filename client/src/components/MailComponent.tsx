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

  const handleEmail = async () => {
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/Otp/send-otp`, { email });
      setstepPageCount(stepPageCount + 1);
      navigate(`/getUrOtp?email=${email}`);
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary-black-600 rounded-2xl p-6 shadow-2xl">
      <input
        type="email"
        onChange={(e) => setemail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleEmail()}
        placeholder="you@example.com"
        className="w-full bg-primary-black-700 text-white px-4 py-3 rounded-xl mb-3 font-poppins text-sm outline-none border border-primary-black-400 focus:border-primary-indigo transition-colors"
      />
      {error && <p className="text-red-400 text-xs mb-3 font-poppins">{error}</p>}
      <button
        className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-3 font-montserrat font-bold disabled:opacity-50"
        onClick={handleEmail}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send OTP →"}
      </button>
      <p className="text-secondary-white text-xs font-poppins mt-4 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default MailComponent;
