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
        setError("USERNAME TAKEN. TRY ANOTHER.");
        setLoading(false);
        return;
      }
      dispatch(setUserName(userName.trim()));
      setstepPageCount(stepPageCount + 1);
      navigate(`/loginPage?name=${userName.trim()}`);
    } catch {
      setError("SOMETHING WENT WRONG.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-sm anim-fade-up">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
          — STEP 03 / IDENTITY —
        </p>
        <h1 className="font-bebas text-6xl leading-none mb-1" style={{ color: "var(--paper)" }}>
          WHAT'S YOUR
        </h1>
        <h2 className="font-bebas text-6xl leading-none mb-8" style={{ color: "var(--gold)" }}>
          NAME?
        </h2>

        <input
          placeholder="your_username"
          className="w-full px-4 py-3 font-mono text-sm outline-none mb-3 transition-colors"
          style={{
            background: "var(--ink-2)",
            border: "1px solid var(--ink-4)",
            color: "var(--paper)",
          }}
          value={userName}
          onChange={(e) => { setuserName(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--ink-4)")}
        />

        {error && (
          <p className="font-mono text-xs mb-3" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        <button
          className="w-full font-bebas tracking-widest text-lg py-3 transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
          onClick={handleNext}
          disabled={!userName.trim() || loading}
        >
          {loading ? "CHECKING..." : "CONTINUE →"}
        </button>
      </div>
    </div>
  );
};

export default NamePage;
