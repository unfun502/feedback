import { BODY } from '../utils';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

function StatusBadge({ status }) {
  return (
    <span style={{
      fontFamily: BODY, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      background: STATUS_COLORS[status] + "18", color: STATUS_COLORS[status],
      textTransform: "capitalize", whiteSpace: "nowrap",
    }}>{STATUS_LABELS[status] || status}</span>
  );
}

export default StatusBadge;
