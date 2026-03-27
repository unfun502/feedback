import { useTheme } from '../theme';
import { HEADING, BODY } from '../utils';
import ViewSwitcher from './ViewSwitcher';
import ThemeToggle from './ThemeToggle';

function Header({ view, onViewChange, selectedApp, apps }) {
  const { t } = useTheme();
  const app = selectedApp ? apps.find((a) => a.id === selectedApp) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{
          fontFamily: HEADING, fontSize: 30, fontWeight: 700, color: t.text,
          margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {app ? <><span style={{ fontSize: 26 }}>{app.emoji}</span>{app.name}</> : "All Feedback"}
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 14, color: t.textMuted, margin: "4px 0 0 0" }}>
          {app ? <>Bug reports, features & feedback for <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ color: app.accent, textDecoration: "none", fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>{app.name}</a></> : "Feedback across all apps"}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ViewSwitcher view={view} onViewChange={onViewChange} />
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Header;
