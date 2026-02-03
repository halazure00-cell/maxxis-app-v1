import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import PanicButton from "../safety/PanicButton";
import OnboardingTour from "../onboarding/OnboardingTour";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <OnboardingTour />
      <main className="pb-20 safe-bottom">
        <Outlet />
      </main>
      <PanicButton />
      <BottomNav />
    </div>
  );
};

export default AppLayout;
