import Lottie from "lottie-react";
import loaderAnimation from "../../loader.json"; // adjust path if needed

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <Lottie animationData={loaderAnimation} loop={true} style={{ width: 200, height: 200 }} />
    </div>
  );
}
