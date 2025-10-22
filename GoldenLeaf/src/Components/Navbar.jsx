import React from "react";
import { NavLink } from "react-router-dom";
import { User, Sun, Moon, LogOut, Home as HomeIcon, LayoutDashboard, Sparkles, Send, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const baseLink =
  "w-full px-3.5 py-2.5 rounded-md font-semibold text-sm md:text-base transition-colors flex items-center gap-2";
const inactive = "text-[var(--muted)] hover:bg-[var(--hover)]";
const active = "bg-[var(--active-bg)] text-[var(--active-text)]";
// Mobile icon-only link styles
const iconLinkBase = "p-2 rounded-md transition-colors";
const iconInactive = "text-[var(--muted)] hover:bg-[var(--hover)]";
const iconActive = "bg-[var(--active-bg)] text-[var(--active-text)]";

export default function Navbar() {
  const [darkMode, setDarkMode] = React.useState(
    localStorage.getItem("theme") === "dark"
  );
  const navigate = useNavigate();
  const [displayName, setDisplayName] = React.useState(localStorage.getItem('userName') || 'User');
  const [displayEmail, setDisplayEmail] = React.useState(localStorage.getItem('userEmail') || 'user@example.com');

  // Fetch user profile once if token exists
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // not logged in
    let alive = true;
    API.get('/api/v1/user/me')
      .then((res) => {
        if (!alive) return;
        const { name, email } = res.data || {};
        if (name) {
          setDisplayName(name);
          localStorage.setItem('userName', name);
        }
        if (email) {
          setDisplayEmail(email);
          localStorage.setItem('userEmail', email);
        }
      })
      .catch(() => {
        // ignore profile fetch errors
      });
    return () => { alive = false };
  }, []);
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <>
      {/* Mobile Top Bar (icons only) */}
      <header
        className={`md:hidden sticky top-0 z-50 ${
          darkMode ? 'bg-gradient-to-b from-[#0f0b06] to-[#1a140c]' : 'bg-[#f7f5f1]'
        } backdrop-blur border-b border-[var(--border)] transition-colors duration-300`}
      >
        <div className="h-14 px-3 flex items-center justify-between">
          <div className="text-[var(--gold)] font-serif font-bold text-xl select-none">Grouply</div>
          <nav className="flex items-center gap-2">
            {[
              { to: "/home", label: "Home", icon: HomeIcon },
              { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { to: "/ai", label: "Smart AI", icon: Sparkles },
              { to: "/transfer", label: "Money Transfer", icon: Send },
              { to: "/SplitBill", label: "Split Bill", icon: Info },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                aria-label={item.label}
                className={({ isActive }) => `${iconLinkBase} ${isActive ? iconActive : iconInactive}`}
              >
                <item.icon size={18} className="shrink-0" />
              </NavLink>
            ))}
            <button
              aria-label="Toggle Theme"
              onClick={toggleTheme}
              className={`${iconLinkBase} ${iconInactive}`}
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              aria-label="Logout"
              onClick={() => { localStorage.clear(); navigate('/'); }}
              className={`${iconLinkBase} ${iconInactive}`}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      {/* Desktop Right Sidebar */}
      <aside
        className={`hidden md:flex fixed right-0 top-0 z-50 h-screen w-72 ${
          darkMode
            ? 'bg-gradient-to-b from-[#0f0b06] to-[#1a140c]'
            : 'bg-[#f7f5f1]'
        } backdrop-blur border-l border-[var(--border)] transition-colors duration-300 flex-col`}
        aria-label="Right sidebar navigation"
      >
      {/* Header / Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="text-[var(--gold)] font-serif font-bold text-3xl select-none">Grouply</div>
        <div className="mt-1 text-xs text-[var(--muted)]">A FinTech Saver</div>
      </div>

      {/* Nav Links */}
      <nav className="px-4 py-5 flex-1 overflow-y-auto">
        <div className="flex flex-col space-y-1 divide-y divide-[var(--border)]/60">
          {[
            { to: "/home", label: "Home", icon: HomeIcon },
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/ai", label: "Smart AI", icon: Sparkles },
            { to: "/transfer", label: "Money Transfer", icon: Send },
            { to: "/Split-Bill", label: "Split Bill", icon: Info },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `${baseLink} ${isActive ? active : inactive}`}
            >
              <item.icon size={18} className="shrink-0 opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer: user + actions */}
      <div className="mt-auto px-4 pb-4 pt-3 border-t cursor-pointer border-[var(--border)]">
        <div className="flex items-center gap-3" onClick={() => navigate('/profile')}>
          <div className="w-9 h-9 rounded-full bg-[var(--hover)] grid place-items-center text-[var(--muted)]">
            <User size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--active-text)] truncate">{displayName}</div>
            <div className="text-xs text-[var(--muted)] truncate">{displayEmail}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            aria-label="Toggle Theme"
            onClick={toggleTheme}
            className="p-2 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--hover)] transition-all"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            aria-label="Logout"
            onClick={() => {
              window.localStorage.clear();
              navigate('/');
            }}
            className="p-2 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--hover)] transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
