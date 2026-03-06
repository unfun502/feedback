import { BODY } from '../utils';
import { TYPE_COLORS, TYPE_LABELS } from '../constants';

function TypeBadge({ type }) {
  const icons = { bug: "\uD83D\uDC1B", feature: "\u2728", general: "\uD83D\uDCAC" };
  return (
    <span style={{
      fontFamily: BODY, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20,
      background: TYPE_COLORS[type] + "15", color: TYPE_COLORS[type],
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ fontSize: 11 }}>{icons[type]}</span>
      {TYPE_LABELS[type]}
    </span>
  );
}

export default TypeBadge;
