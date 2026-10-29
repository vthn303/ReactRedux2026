import NetworkStatus from "./components/NetworkStatus";
import BreedHome from "./pages/BreedHome";

export default function App() {
  return (
    <div className="min-h-screen bg-[#2b2224] text-white">
      <NetworkStatus />
      <BreedHome />
    </div>
  );
}
