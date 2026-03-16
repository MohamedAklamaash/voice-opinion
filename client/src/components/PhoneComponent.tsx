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
    <div className="bg-secondary-black-600 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 bg-primary-black-700 rounded-xl px-4 py-3 mb-3 border border-primary-black-400 focus-within:border-primary-indigo transition-colors">
        <img src={indianFlag} alt="+91" className="w-6 h-6 rounded-sm" />
        <span className="text-secondary-white font-poppins text-sm">+91</span>
        <div className="w-px h-5 bg-primary-black-400" />
        <input
          type="tel"
          className="flex-1 bg-transparent text-white font-poppins text-sm outline-none"
          onChange={(e) => setphoneNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          placeholder="10-digit number"
          maxLength={10}
        />
      </div>
      {phoneNumber && !isValid && (
        <p className="text-red-400 text-xs mb-3 font-poppins">Enter a valid 10-digit number</p>
      )}
      <button
        className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-3 font-montserrat font-bold disabled:opacity-50"
        onClick={handleNext}
        disabled={!isValid}
      >
        Send OTP →
      </button>
      <p className="text-secondary-white text-xs font-poppins mt-4 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default PhoneComponent;
