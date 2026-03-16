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
    <div className="h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">👋</span>
          <h1 className="text-3xl font-bold font-montserrat mt-3">Welcome back</h1>
          <p className="text-secondary-white text-sm font-poppins mt-1">Sign in to join the conversation</p>
        </div>
        <div className="bg-secondary-black-600 rounded-2xl p-2 flex mb-6">
          <button
            onClick={() => setcomponent("mail")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-poppins text-sm font-semibold transition-all ${
              component === "mail" ? "bg-primary-indigo text-white" : "text-secondary-white hover:text-white"
            }`}
          >
            <MailIcon fontSize="small" /> Email
          </button>
          <button
            onClick={() => setcomponent("phone")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-poppins text-sm font-semibold transition-all ${
              component === "phone" ? "bg-primary-indigo text-white" : "text-secondary-white hover:text-white"
            }`}
          >
            <PhoneAndroidIcon fontSize="small" /> Phone
          </button>
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
