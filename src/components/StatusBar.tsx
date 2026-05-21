interface Props {
  isReady: boolean;
  affixCount: number;
  itemCount: number;
  ts: number;
}

export function StatusBar({ isReady, affixCount, itemCount, ts }: Props) {
  if (!isReady) {
    return (
      <div className="flex items-center gap-2.5 text-xs font-cinzel tracking-wide py-2">
        <span className="size-1.5 rounded-full bg-d4-gold animate-pulse-slow shrink-0" />
        <span className="text-d4-gold2">Loading index…</span>
      </div>
    );
  }

  const ageH = Math.round((Date.now() - ts) / (1000 * 60 * 60));
  const age = ageH < 1 ? "just now" : ageH < 24 ? `${ageH}h ago` : `${Math.round(ageH / 24)}d ago`;

  return (
    <div className="flex items-center gap-2.5 text-xs font-cinzel tracking-wide py-2">
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: "#4caf50", boxShadow: "0 0 5px #4caf5088" }}
      />
      <span style={{ color: "#4caf50" }}>Index ready</span>
      <span className="text-d4-text3">·</span>
      <span className="text-d4-text2">{affixCount.toLocaleString()} affixes</span>
      <span className="text-d4-text3">·</span>
      <span className="text-d4-text2">{itemCount.toLocaleString()} items</span>
      <span className="ml-auto text-d4-text3 text-xs">seeded {age}</span>
    </div>
  );
}
