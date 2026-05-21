import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "zustand";
import { RuleEditor } from "../components/editor/RuleEditor";
import { useAffixDb } from "../lib/affixDb";
import { loadFilterIntoEditor, useEditorStore } from "../store/editorStore";
import { useFilterStore } from "../store/filterStore";

export const Route = createFileRoute("/edit")({
  component: EditPage,
});

function EditPage() {
  useAffixDb(); // ensure DB is populated

  const { filter, exportedB64, addRule, setFilterName, exportFilter, clearExport } =
    useEditorStore();
  const canUndo = useStore(useEditorStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useEditorStore.temporal, (s) => s.futureStates.length > 0);

  const viewerFilter = useFilterStore((s) => s.filter);

  function handleCopy() {
    try {
      const b64 = exportFilter();
      navigator.clipboard.writeText(b64).catch(() => {});
    } catch {
      /* serialization failed — nothing to copy */
    }
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="relative text-center py-14 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(160,100,20,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(175,135,50,0.25), transparent)",
          }}
        />

        <div className="relative">
          <div
            aria-hidden="true"
            className="text-4xl mb-3 select-none"
            style={{ filter: "drop-shadow(0 0 16px rgba(175,135,50,0.7))" }}
          >
            ⚔
          </div>
          <h1
            className="font-cinzel font-black tracking-[.1em] uppercase text-d4-gold2 m-0 leading-tight"
            style={{
              fontSize: "clamp(22px,4vw,40px)",
              textShadow: "0 0 40px rgba(175,135,50,.45)",
            }}
          >
            Diablo IV
          </h1>
          <p className="font-cinzel text-d4-gold/60 tracking-[.3em] uppercase text-xs mt-1 mb-5">
            Filter Editor
          </p>

          <div
            className="inline-flex rounded-lg p-0.5 gap-0.5"
            style={{
              background: "rgba(175,135,50,0.08)",
              border: "1px solid rgba(175,135,50,0.18)",
            }}
          >
            <Link
              to="/"
              className="font-cinzel text-xs tracking-[.1em] uppercase px-4 py-1.5 rounded-md text-d4-text3 hover:text-d4-gold transition-colors"
            >
              View
            </Link>
            <span
              className="font-cinzel text-xs tracking-[.1em] uppercase px-4 py-1.5 rounded-md text-d4-gold font-bold"
              style={{ background: "rgba(175,135,50,0.15)" }}
            >
              Edit
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto px-6 py-6 space-y-4">
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import from viewer */}
          {viewerFilter && (
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => loadFilterIntoEditor(viewerFilter)}
              title="Load the currently-viewed filter into the editor"
            >
              ↓ Import from Viewer
            </button>
          )}

          <div className="flex gap-1">
            <button
              type="button"
              className="btn-secondary text-xs px-2 disabled:opacity-30"
              onClick={() => useEditorStore.temporal.getState().undo()}
              disabled={!canUndo}
              title="Undo"
            >
              ↩
            </button>
            <button
              type="button"
              className="btn-secondary text-xs px-2 disabled:opacity-30"
              onClick={() => useEditorStore.temporal.getState().redo()}
              disabled={!canRedo}
              title="Redo"
            >
              ↪
            </button>
          </div>

          <span className="flex-1" />

          <button type="button" className="btn-primary text-xs" onClick={handleCopy}>
            Copy Filter Code
          </button>
        </div>

        {/* ── Export result ─────────────────────────────────────────── */}
        {exportedB64 && (
          <div className="relative bg-d4-bg2 border border-d4-gold/40 rounded p-3">
            <p className="text-xs font-cinzel uppercase tracking-widest text-d4-gold mb-1.5">
              Filter Code (base64)
            </p>
            <textarea
              readOnly
              value={exportedB64}
              rows={3}
              className="w-full bg-transparent font-mono text-xs text-d4-text2 resize-none outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <button
              type="button"
              className="absolute top-2 right-2 text-d4-text3 hover:text-d4-gold text-base leading-none"
              onClick={clearExport}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Filter name ───────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="filter-name"
            className="block font-cinzel text-xs tracking-[.15em] uppercase text-d4-text3 mb-1"
          >
            Filter Name
          </label>
          <input
            id="filter-name"
            type="text"
            value={filter.name}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full bg-d4-bg2 border border-d4-border rounded px-3 py-2 text-d4-gold3 font-cinzel text-sm outline-none focus:border-d4-gold"
            placeholder="My Filter"
          />
        </div>

        {/* ── Rules ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-cinzel text-xs tracking-[.15em] uppercase text-d4-gold">
              Rules <span className="text-d4-text3">({filter.rules.length})</span>
            </h2>
            <span className="flex-1 h-px bg-d4-border" />
            <button type="button" className="btn-primary text-xs" onClick={addRule}>
              + Add Rule
            </button>
          </div>

          {filter.rules.length === 0 && (
            <div className="text-center py-10 text-d4-text3">
              <p className="font-cinzel text-xs tracking-widest uppercase">No rules yet</p>
              <p className="text-xs mt-1">Click "Add Rule" to get started.</p>
            </div>
          )}

          <div className="space-y-3">
            {filter.rules.map((rule, i) => (
              <RuleEditor
                // biome-ignore lint/suspicious/noArrayIndexKey: rules have no stable IDs
                key={i}
                rule={rule}
                index={i}
                total={filter.rules.length}
              />
            ))}
          </div>
        </div>

        {filter.rules.length > 0 && (
          <div className="text-center pb-16">
            <button type="button" className="btn-primary" onClick={handleCopy}>
              Copy Filter Code
            </button>
            <p className="text-xs text-d4-text3 mt-2">Paste the code into the game's filter UI</p>
          </div>
        )}
      </div>
    </div>
  );
}
