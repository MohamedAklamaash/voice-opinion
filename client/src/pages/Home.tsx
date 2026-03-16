import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

interface Props {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
}

const Home = ({ stepPageCount, setstepPageCount }: Props) => {
  const navigate = useNavigate();
  const { userName, userProfileUrl } = useSelector(
    (state: { user: { userName: string; userProfileUrl: string } }) => state.user
  );

  if (userName) {
    window.location.href = `/home?userName=${userName}&profileUrl=${userProfileUrl}`;
    return null;
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--ink)" }}>
      {/* Ticker tape */}
      <div className="ticker-wrap py-2" style={{ color: "var(--gold)" }}>
        <div className="ticker-inner">
          {Array(6).fill("VOICE UR OPINION · LIVE AUDIO ROOMS · SPEAK FREELY · DROP IN · ").map((t, i) => (
            <span key={i} className="font-mono text-xs tracking-widest mr-8">{t}</span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <p
          className="font-mono text-xs tracking-widest mb-6 anim-fade-up"
          style={{ color: "var(--ash)", animationDelay: "0s" }}
        >
          — LIVE AUDIO PLATFORM —
        </p>

        <h1
          className="font-bebas leading-none mb-4 anim-fade-up"
          style={{
            fontSize: "clamp(4rem, 14vw, 10rem)",
            color: "var(--paper)",
            animationDelay: "0.1s",
          }}
        >
          VOICE UR
          <br />
          <span style={{ color: "var(--gold)", WebkitTextStroke: "0px" }}>OPINION</span>
        </h1>

        <p
          className="font-fraunces italic text-lg mb-12 max-w-sm anim-fade-up"
          style={{ color: "var(--ash)", animationDelay: "0.2s" }}
        >
          Drop into live audio rooms. Talk, listen, vibe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 anim-fade-up" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={() => { setstepPageCount(stepPageCount + 1); navigate("/signIn"); }}
            className="font-bebas tracking-widest text-lg px-10 py-3 transition-all hover:opacity-80"
            style={{
              background: "var(--gold)",
              color: "var(--ink)",
            }}
          >
            GET STARTED →
          </button>
          <button
            onClick={() => navigate("/signIn")}
            className="font-mono text-xs tracking-widest px-8 py-3 transition-all hover:opacity-70"
            style={{
              border: "1px solid var(--ink-5)",
              color: "var(--ash)",
            }}
          >
            SIGN IN
          </button>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="gold-rule" />
      <div className="px-6 py-4 flex justify-between items-center">
        <span className="font-mono text-xs" style={{ color: "var(--ink-5)" }}>© 2026</span>
        <span className="font-mono text-xs" style={{ color: "var(--ink-5)" }}>BETA</span>
      </div>
    </div>
  );
};

export default Home;
