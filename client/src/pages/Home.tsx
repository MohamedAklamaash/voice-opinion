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
    <div className="h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <span className="text-6xl">🎙️</span>
          <h1 className="text-4xl font-bold font-montserrat mt-4 mb-2">Voice Ur Opinion</h1>
          <p className="text-secondary-white text-sm font-poppins">
            Drop into live audio rooms. Talk, listen, vibe.
          </p>
        </div>
        <div className="bg-secondary-black-600 rounded-2xl p-8 shadow-2xl">
          <p className="text-secondary-white font-poppins text-sm mb-8 leading-relaxed">
            We're rolling out access gradually to keep things smooth. Jump in and start talking.
          </p>
          <button
            className="w-full bg-primary-indigo hover:opacity-90 transition-opacity rounded-full py-4 font-montserrat font-bold text-lg mb-4"
            onClick={() => { setstepPageCount(stepPageCount + 1); navigate("/signIn"); }}
          >
            Get Started →
          </button>
          <button
            className="w-full text-primary-indigo font-poppins text-sm hover:underline"
            onClick={() => navigate("/signIn")}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
