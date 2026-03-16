import { Theme } from "../App";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setProfileUrl } from "../store/UserSlice";
import { randomAvatar } from "../utils/avatars";

type Props = {
  setstepPageCount: (num: number) => void;
  stepPageCount: number;
  primaryTheme: Theme;
};

const LoginPage = ({ setstepPageCount, stepPageCount }: Props) => {
  const navigate = useNavigate();
  const userName = new URLSearchParams(window.location.search).get("name");
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  // pick a random default avatar once on mount
  const [defaultAvatar] = useState(() => randomAvatar());
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("SELECT A VALID IMAGE."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("MAX 2MB."); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const uploadImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append("file", image);
      data.append("upload_preset", "qyde2sjh");
      const res = await axios.post("https://api.cloudinary.com/v1_1/duhkiwuqq/image/upload", data);
      setUrl(res.data.secure_url);
      setError(null);
    } catch {
      setError("UPLOAD FAILED.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setstepPageCount(stepPageCount + 1);
    // use uploaded url, or fall back to the randomly chosen default avatar
    const finalUrl = url || defaultAvatar;
    dispatch(setProfileUrl(finalUrl));
    navigate(`/home?userName=${userName}&profileUrl=${finalUrl}`);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-xs anim-fade-up">
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
          — STEP 04 / PROFILE —
        </p>
        <h1 className="font-bebas text-5xl leading-none mb-1" style={{ color: "var(--paper)" }}>
          HEY,{" "}
          <span style={{ color: "var(--gold)" }}>
            {userName ? userName.toUpperCase() : ""}
          </span>
        </h1>
        <p className="font-mono text-xs mb-8" style={{ color: "var(--ash)" }}>
          Add a profile photo — optional.
        </p>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative">
            <img
              src={preview || defaultAvatar}
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: "2px solid var(--gold)" }}
              alt="Profile"
            />
            <label
              htmlFor="fileInput"
              className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center cursor-pointer font-bebas text-sm"
              style={{ background: "var(--gold)", color: "var(--ink)" }}
            >
              +
            </label>
            <input type="file" accept="image/*" id="fileInput" className="hidden" onChange={handleFileChange} />
          </div>

          {error && <p className="font-mono text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

          {image && !url && (
            <button
              className="font-mono text-xs tracking-widest px-6 py-2 transition-all hover:opacity-80 disabled:opacity-30"
              style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
              onClick={uploadImage}
              disabled={loading}
            >
              {loading ? "UPLOADING..." : "UPLOAD PHOTO"}
            </button>
          )}
          {url && (
            <p className="font-mono text-xs" style={{ color: "var(--signal)" }}>
              ✓ PHOTO UPLOADED
            </p>
          )}
        </div>

        <button
          className="w-full font-bebas tracking-widest text-lg py-3 transition-all hover:opacity-80"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
          onClick={handleContinue}
        >
          ENTER THE APP →
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
