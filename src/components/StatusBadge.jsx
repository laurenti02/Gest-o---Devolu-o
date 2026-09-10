import { statusLabel, statusTone } from "../lib/format";

const TONES = {
  ok: "bg-okbg text-ok border-ok/30",
  warn: "bg-warnbg text-warn border-warn/30",
  bad: "bg-badbg text-bad border-bad/30",
  info: "bg-sand text-ink border-line",
};

export default function StatusBadge({ status }) {
  const tone = TONES[statusTone(status)] || TONES.info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
