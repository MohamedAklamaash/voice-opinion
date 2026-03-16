import { Theme } from "../App";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DummyLogo from "../assets/DummyLogo.jpeg";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setProfileUrl } from "../store/UserSlice";

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
  const [preview, setPreview] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Select a valid image."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Max 2MB."); return; }
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
      setError("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setstepPageCount(stepPageCount + 1);
    if (url) dispatch(setProfileUrl(url));
    navigate(`/home?userName=${userName}&profileUrl=${url}`);
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-xs text-center">
        <h1 className="text-xl font-bold font-montserrat mb-1">
          Hey, <span className="text-primary-indigo">{userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : ""}</span> 👋
        </h1>
        <p className="text-secondary-white text-xs font-poppins mb-4">Add a profile photo (optional)</p>

        <div className="bg-secondary-black-600 rounded-2xl p-5 shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <img
              src={preview || DummyLogo}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary-indigo"
              alt="Profile"
            />
            <label htmlFor="fileInput" className="absolute bottom-0 right-0 bg-primary-indigo rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:opacity-90">
              <span className="text-white text-base leading-none">+</span>
            </label>
            <input type="file" accept="image/*" id="fileInput" className="hidden" onChange={handleFileChange} />
          </div>

          {error && <p className="text-red-400 text-xs mb-2 font-poppins">{error}</p>}

          {image && !url && (
            <button
              className="w-full border border-primary-indigo text-primary-indigo hover:bg-primary-indigo hover:text-white transition-all rounded-full py-2 font-poppins text-sm font-semibold mb-3 disabled:opacity-50"
              onClick={uploadImage}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Photo"}
            </button>
          )}
          {url && <p className="text-primary-success text-xs font-poppins mb-3">✓ Photo uploaded</p>}

          <button
            className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-3 font-montserrat font-bold text-sm"
            onClick={handleContinue}
          >
            Enter the app →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
