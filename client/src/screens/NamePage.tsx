import { Theme } from "../App";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserName } from "../store/UserSlice";
import axios from "axios";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

const NamePage = ({ stepPageCount, setstepPageCount }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const email = useSelector((state: { user: { email: string } }) => state.user.email);
  const [userName, setuserName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!userName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post<{ available: boolean }>(
        `${import.meta.env.VITE_API_URL}/userActivation/checkName`,
        { name: userName.trim(), email }
      );
      if (!data.available) {
        setError("This username is already taken. Try another.");
        setLoading(false);
        return;
      }
      dispatch(setUserName(userName.trim()));
      setstepPageCount(stepPageCount + 1);
      navigate(`/loginPage?name=${userName.trim()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-sm text-center">
        <span className="text-5xl">🤔</span>
        <h1 className="text-2xl font-bold font-montserrat mt-4 mb-1">What's your name?</h1>
        <p className="text-secondary-white text-sm font-poppins mb-8">This is how others will see you in rooms</p>
        <div className="bg-secondary-black-600 rounded-2xl p-6 shadow-2xl">
          <input
            placeholder="Your username"
            className="w-full bg-primary-black-700 text-white px-4 py-3 rounded-xl mb-2 font-poppins text-sm outline-none border border-primary-black-400 focus:border-primary-indigo transition-colors"
            value={userName}
            onChange={(e) => { setuserName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
          />
          {error && <p className="text-red-400 text-xs font-poppins mb-3">{error}</p>}
          <button
            className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-3 font-montserrat font-bold disabled:opacity-50 mt-2"
            onClick={handleNext}
            disabled={!userName.trim() || loading}
          >
            {loading ? "Checking..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NamePage;
