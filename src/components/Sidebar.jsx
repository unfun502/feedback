import { useState } from 'react';
import { useTheme } from '../theme';
import { HEADING, BODY } from '../utils';

function Sidebar({ apps, selectedApp, onSelectApp, collapsed, onToggleCollapse }) {
  const { t } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const itemStyle = (id, isActive) => ({
    display: "flex", alignItems: "center",
    gap: collapsed ? 0 : 12,
    justifyContent: collapsed ? "center" : "flex-start",
    padding: collapsed ? "10px 0" : "10px 16px",
    borderRadius: 10, cursor: "pointer",
    background: isActive ? t.sidebarHover : hoveredItem === id ? "rgba(255,255,255,0.05)" : "transparent",
    color: isActive ? t.sidebarTextActive : t.sidebarText,
    fontFamily: BODY, fontSize: 14, fontWeight: isActive ? 600 : 400,
    transition: "all 0.2s ease", whiteSpace: "nowrap", overflow: "hidden",
  });

  return (
    <div style={{
      width: collapsed ? 60 : 240, minWidth: collapsed ? 60 : 240,
      background: t.sidebarBg, display: "flex", flexDirection: "column",
      padding: collapsed ? "20px 8px" : "20px 16px",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      borderRight: `1px solid ${t.sidebarBorder}`,
      height: "100vh", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        marginBottom: 32, paddingLeft: collapsed ? 0 : 4,
      }}>
        {!collapsed && (
          <span style={{
            fontFamily: HEADING, fontSize: 24, fontWeight: 700,
            color: "#fafaf9", letterSpacing: "-0.02em",
          }}>Feedback</span>
        )}
        <button onClick={onToggleCollapse} style={{
          background: "none", border: "none", color: t.sidebarText,
          cursor: "pointer", padding: 4, display: "flex",
          alignItems: "center", justifyContent: "center", borderRadius: 6,
          transition: "color 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fafaf9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.sidebarText)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={itemStyle("all", selectedApp === null)}
        onClick={() => onSelectApp(null)}
        onMouseEnter={() => setHoveredItem("all")}
        onMouseLeave={() => setHoveredItem(null)}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>📋</span>
        {!collapsed && <span>All Apps</span>}
      </div>

      <div style={{ height: 1, background: t.sidebarBorder, margin: "12px 0" }} />

      {apps.map((app) => (
        <div key={app.id} style={itemStyle(app.id, selectedApp === app.id)}
          onClick={() => onSelectApp(app.id)}
          onMouseEnter={() => setHoveredItem(app.id)}
          onMouseLeave={() => setHoveredItem(null)}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{app.emoji}</span>
          {!collapsed && <span>{app.name}</span>}
          {!collapsed && selectedApp === app.id && (
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: app.accent, marginLeft: "auto", flexShrink: 0,
            }} />
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />
      {!collapsed && (
        <div style={{ fontFamily: BODY, fontSize: 12, color: t.sidebarText, opacity: 0.5, padding: "8px 4px" }}>
          feedback.devlab502.net
        </div>
      )}
    </div>
  );
}

export default Sidebar;
