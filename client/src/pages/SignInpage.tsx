import { Theme } from "../App";
import { useState } from "react";
import MailIcon from "@mui/icons-material/Mail";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import PhoneComponent from "../components/PhoneComponent";
import MailComponent from "../components/MailComponent";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

type Component = "mail" | "phone";

const SignInpage = ({ setstepPageCount, stepPageCount, primaryTheme }: Props) => {
  const [component, setcomponent] = useState<Component>("mail");

  return (
    <div className="flex-1 flex items-center justify-center px-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-sm anim-fade-up">
        {/* Header */}
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
          — STEP 01 / IDENTIFY —
        </p>
        <h1 className="font-bebas text-6xl leading-none mb-1" style={{ color: "var(--paper)" }}>
          WELCOME
        </h1>
        <h2 className="font-bebas text-6xl leading-none mb-8" style={{ color: "var(--gold)" }}>
          BACK.
        </h2>

        {/* Tab switcher */}
        <div
          className="flex mb-6"
          style={{ borderBottom: "1px solid var(--ink-4)" }}
        >
          {(["mail", "phone"] as Component[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setcomponent(tab)}
              className="flex items-center gap-2 px-4 py-3 font-mono text-xs tracking-widest transition-all"
              style={{
                color: component === tab ? "var(--gold)" : "var(--ash)",
                borderBottom: component === tab ? "2px solid var(--gold)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab === "mail" ? <MailIcon sx={{ fontSize: 14 }} /> : <PhoneAndroidIcon sx={{ fontSize: 14 }} />}
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {component === "phone" ? (
          <PhoneComponent setstepPageCount={setstepPageCount} stepPageCount={stepPageCount} primaryTheme={primaryTheme} />
        ) : (
          <MailComponent setstepPageCount={setstepPageCount} stepPageCount={stepPageCount} primaryTheme={primaryTheme} />
        )}
      </div>
    </div>
  );
};

export default SignInpage;
