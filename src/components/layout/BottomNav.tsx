import { NavLink } from "react-router-dom";
import { 
  Home, 
  MapPin, 
  Wallet,
  Shield,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "relative flex flex-col items-center justify-center gap-0.5 flex-1 max-w-20 py-2 transition-all",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span className="absolute inset-x-2 inset-y-1 bg-primary/15 rounded-xl -z-10" />
        )}
        <span className={cn(
          "transition-transform",
          isActive && "scale-110"
        )}>
          {icon}
        </span>
        <span className={cn(
          "text-[10px] font-medium truncate",
          isActive && "font-semibold"
        )}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Beranda" />
      <NavItem to="/finance" icon={<Wallet className="w-5 h-5" />} label="Keuangan" />
      <NavItem to="/map" icon={<MapPin className="w-5 h-5" />} label="Hotspot" />
      <NavItem to="/safety" icon={<Shield className="w-5 h-5" />} label="Darurat" />
      <NavItem to="/profile" icon={<User className="w-5 h-5" />} label="Profil" />
    </nav>
  );
};

export default BottomNav;
