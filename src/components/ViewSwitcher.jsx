import { useTheme } from '../theme';
import { BODY } from '../utils';

function ViewSwitcher({ view, onViewChange }) {
  const { t } = useTheme();
  const views = ["Board", "Roadmap", "Changelog"];
  return (
    <div style={{ display: "flex", background: t.btnSecondaryBg, borderRadius: 12, padding: 3, gap: 2 }}>
      {views.map((v) => {
        const isActive = view === v.toLowerCase();
        return (
          <button key={v} onClick={() => onViewChange(v.toLowerCase())} style={{
            fontFamily: BODY, fontSize: 13, fontWeight: isActive ? 600 : 500,
            padding: "7px 18px", border: "none", borderRadius: 10, cursor: "pointer",
            background: isActive ? t.card : "transparent",
            color: isActive ? t.text : t.textMuted,
            boxShadow: isActive ? t.shadow : "none", transition: "all 0.25s ease",
          }}>{v}</button>
        );
      })}
    </div>
  );
}

export default ViewSwitcher;
