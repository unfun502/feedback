import { useTheme } from '../theme';
import { BODY } from '../utils';
import { STATUSES, STATUS_LABELS } from '../constants';

function FilterBar({ filters, onFilterChange, onNewPost }) {
  const { t } = useTheme();
  const selectStyle = {
    fontFamily: BODY, fontSize: 13, padding: "8px 12px", borderRadius: 10,
    border: `1px solid ${t.border}`, background: t.inputBg, color: t.text,
    cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none",
    paddingRight: 28,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2378716c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  };
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search feedback..." value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          style={{ ...selectStyle, width: "100%", paddingLeft: 38, backgroundImage: "none", paddingRight: 12 }} />
      </div>
      <select value={filters.type} onChange={(e) => onFilterChange({ ...filters, type: e.target.value })} style={selectStyle}>
        <option value="all">All Types</option>
        <option value="bug">Bugs</option>
        <option value="feature">Features</option>
        <option value="general">General</option>
      </select>
      <select value={filters.status} onChange={(e) => onFilterChange({ ...filters, status: e.target.value })} style={selectStyle}>
        <option value="all">All Statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <select value={filters.sort} onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })} style={selectStyle}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="upvotes">Most Voted</option>
      </select>
      <button onClick={onNewPost} style={{
        fontFamily: BODY, fontSize: 13, fontWeight: 600, padding: "8px 20px",
        border: "none", borderRadius: 10, background: t.btnPrimaryBg, color: t.btnPrimaryText,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        transition: "transform 0.15s ease, box-shadow 0.15s ease", marginLeft: "auto",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = t.shadowMd; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Post
      </button>
    </div>
  );
}

export default FilterBar;
