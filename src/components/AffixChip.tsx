import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { affixCollection } from "../lib/collections";
import { CAT_CLASSES } from "../lib/constants";

interface Props {
  snoId: number;
}

export function AffixChip({ snoId }: Props) {
  const { data: entry } = useLiveQuery(
    (q) =>
      q
        .from({ a: affixCollection })
        .where(({ a }) => eq(a.id, snoId))
        .findOne(),
    [snoId],
  );

  const chipCls = entry ? CAT_CLASSES[entry.cat] : "text-d4-text3 border-white/10 bg-white/[0.03]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm font-cinzel font-medium tracking-wide ${chipCls}`}
      title={entry ? `${entry.raw}\nSNO: ${snoId}` : `Unknown SNO: ${snoId}`}
    >
      {entry ? (
        entry.name
      ) : (
        <>
          <em className="text-sm opacity-50 animate-pulse-slow not-italic">resolving…</em>
          <span className="font-mono text-sm opacity-40">0x{snoId.toString(16).toUpperCase()}</span>
        </>
      )}
    </span>
  );
}
