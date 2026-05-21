import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "zustand";
import { RuleCard } from "../components/RuleCard";
import { StatusBar } from "../components/StatusBar";
import { useAffixDb } from "../lib/affixDb";
import { loadFilterIntoEditor } from "../store/editorStore";
import { useFilterStore } from "../store/filterStore";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isReady, affixCount, itemCount, ts } = useAffixDb();
  const { input, filter, error, setInput, parseFilter, loadExample } = useFilterStore();
  const canUndo = useStore(useFilterStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useFilterStore.temporal, (s) => s.futureStates.length > 0);
  const [isInputFocused, setIsInputFocused] = useState(false);

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
            Filter Viewer & Editor
          </p>

          {/* Nav tabs */}
          <div
            className="inline-flex rounded-lg p-0.5 gap-0.5"
            style={{
              background: "rgba(175,135,50,0.08)",
              border: "1px solid rgba(175,135,50,0.18)",
            }}
          >
            <span
              className="font-cinzel text-xs tracking-[.1em] uppercase px-4 py-1.5 rounded-md text-d4-gold font-bold"
              style={{ background: "rgba(175,135,50,0.15)" }}
            >
              View
            </span>
            <Link
              to="/edit"
              className="font-cinzel text-xs tracking-[.1em] uppercase px-4 py-1.5 rounded-md text-d4-text3 hover:text-d4-gold transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto px-6">
        {/* ── Input ────────────────────────────────────────────────────── */}
        <div className="mt-8">
          <label
            htmlFor="filter-input"
            className="block font-cinzel text-xs tracking-[.18em] uppercase text-d4-text3 mb-2"
          >
            Filter share code
          </label>

          <div className="flex gap-2">
            <textarea
              id="filter-input"
              className="flex-1 rounded-xl border text-d4-text2 font-mono text-xs p-3.5 resize-none h-[72px] outline-none transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: isInputFocused ? "rgba(175,135,50,0.5)" : "rgba(175,135,50,0.18)",
                boxShadow: isInputFocused ? "0 0 0 1px rgba(175,135,50,0.15)" : "none",
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste base64 filter code here…"
              spellCheck={false}
            />
            <div className="flex flex-col gap-1.5">
              <button type="button" className="btn-primary h-9" onClick={() => parseFilter()}>
                Parse
              </button>
              <button type="button" className="btn-secondary h-9" onClick={loadExample}>
                Example
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-secondary flex-1 text-xs px-2 h-8 disabled:opacity-20"
                  onClick={() => useFilterStore.temporal.getState().undo()}
                  disabled={!canUndo}
                  title="Undo"
                >
                  ↩
                </button>
                <button
                  type="button"
                  className="btn-secondary flex-1 text-xs px-2 h-8 disabled:opacity-20"
                  onClick={() => useFilterStore.temporal.getState().redo()}
                  disabled={!canRedo}
                  title="Redo"
                >
                  ↪
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-2 px-3 py-2 rounded-lg text-xs text-red-300 border border-red-500/20 bg-red-500/5">
              {error}
            </p>
          )}
        </div>

        {/* ── Status ───────────────────────────────────────────────────── */}
        <StatusBar isReady={isReady} affixCount={affixCount} itemCount={itemCount} ts={ts} />

        {/* ── Filter result ─────────────────────────────────────────────── */}
        {filter ? (
          <div className="mt-1 mb-20">
            {/* Filter header bar */}
            <div
              className="flex items-center gap-3 flex-wrap rounded-xl px-4 py-3 mb-3"
              style={{
                background:
                  "linear-gradient(90deg, rgba(175,135,50,0.10) 0%, rgba(175,135,50,0.03) 100%)",
                border: "1px solid rgba(175,135,50,0.22)",
              }}
            >
              <span
                className="font-cinzel text-lg font-bold text-d4-gold3 leading-tight"
                style={{ textShadow: "0 0 20px rgba(175,135,50,.30)" }}
              >
                {filter.name}
              </span>
              <span
                className="font-cinzel text-xs tracking-[.12em] uppercase font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: "#4caf50",
                  background: "rgba(76,175,80,0.12)",
                  border: "1px solid rgba(76,175,80,0.25)",
                }}
              >
                ● Active
              </span>
              <span className="ml-auto font-cinzel text-xs text-d4-text3">
                {filter.rules.filter((r) => r.type !== 3).length} rules
              </span>
              <Link
                to="/edit"
                className="btn-secondary text-xs py-1"
                onClick={() => loadFilterIntoEditor(filter)}
              >
                Edit →
              </Link>
            </div>

            {filter.rules.map((rule, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: filter rules have no stable IDs
              <RuleCard key={i} rule={rule} delay={i * 25} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-d4-text3">
            <div className="text-5xl mb-5 opacity-20 select-none">🜏</div>
            <p className="font-cinzel text-xs tracking-[.2em] uppercase">
              Paste a filter code above or click Example
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
