import { useState, useMemo } from "react";
import { X, Sparkles, AlertTriangle, Lightbulb, CheckCircle, ChevronRight, Calendar, Plus, Trash2 } from "lucide-react";
import { fmtDate, addDays, weekStart, rgba, uid } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { analyzeSchedule, proposeScheduleChanges } from "../../ai.js";
import { FF } from "../../theme.js";

const RANGE_OPTIONS = [
  { label: "Today",      days: 0  },
  { label: "This Week",  days: 7  },
  { label: "Next 2 Wks", days: 14 },
];

function InsightIcon({ type }) {
  if (type === "warning") return <AlertTriangle size={15} color="#F4881A" strokeWidth={2.2} />;
  if (type === "success") return <CheckCircle   size={15} color="#4AA96C" strokeWidth={2.2} />;
  return <Lightbulb size={15} color="#6366F1" strokeWidth={2.2} />;
}

function insightStyle(type) {
  if (type === "warning") return { bg: rgba("#F4881A",0.07), border: rgba("#F4881A",0.22) };
  if (type === "success") return { bg: rgba("#4AA96C",0.07), border: rgba("#4AA96C",0.22) };
  return { bg: rgba("#6366F1",0.07), border: rgba("#6366F1",0.22) };
}

function changeIcon(action) {
  if (action === "create")     return <Plus size={13} color="#4AA96C" />;
  if (action === "delete")     return <Trash2 size={13} color="#E05555" />;
  return <Calendar size={13} color="#6366F1" />;
}

export default function ScheduleOptimizerPanel({ events, date, currentUser, onApplyChanges, onClose, T, accent }) {
  const [rangeIdx,   setRangeIdx]   = useState(1);
  const [insights,   setInsights]   = useState(null);
  const [proposals,  setProposals]  = useState(null);
  const [selected,   setSelected]   = useState(new Set());
  const [loading,    setLoading]    = useState(false);
  const [propLoading,setPropLoading] = useState(false);
  const [error,      setError]      = useState("");
  const [step,       setStep]       = useState("analyze"); // "analyze" | "propose" | "apply"

  const rangeOpt = RANGE_OPTIONS[rangeIdx];
  const today    = new Date(date);

  const rangeEvents = useMemo(() => {
    const start = rangeOpt.days === 0 ? today : weekStart(today);
    const end   = addDays(start, rangeOpt.days === 0 ? 0 : rangeOpt.days - 1);
    return expandEvents(events, start, end)
      .filter(e => (e.pids || []).includes(currentUser));
  }, [events, rangeIdx, currentUser]);

  const dayGroups      = useMemo(() => { const m = {}; rangeEvents.filter(e => !e.allDay).forEach(e => { if (!m[e.date]) m[e.date] = []; m[e.date].push(e); }); return m; }, [rangeEvents]);
  const overloadedDays = Object.values(dayGroups).filter(evs => evs.length >= 4).length;
  const totalEvents    = rangeEvents.length;

  async function runAnalysis() {
    setLoading(true); setError(""); setInsights(null); setProposals(null); setStep("analyze");
    try {
      const label = rangeOpt.days === 0
        ? fmtDate(today)
        : `${fmtDate(weekStart(today))} to ${fmtDate(addDays(weekStart(today), rangeOpt.days - 1))}`;
      const result = await analyzeSchedule(rangeEvents.filter(e => !e.allDay), label);
      setInsights(result);
    } catch (e) {
      setError(e.message || "Failed. Check your AI API key in Settings.");
    }
    setLoading(false);
  }

  async function runPropose() {
    setPropLoading(true); setError("");
    try {
      const label = rangeOpt.days === 0 ? fmtDate(today) : `${fmtDate(weekStart(today))} to ${fmtDate(addDays(weekStart(today), rangeOpt.days - 1))}`;
      const result = await proposeScheduleChanges(rangeEvents.filter(e => !e.allDay), insights, label);
      setProposals(result);
      setSelected(new Set(result.map((_, i) => i)));
      setStep("propose");
    } catch (e) {
      setError(e.message || "Failed to generate proposals.");
    }
    setPropLoading(false);
  }

  function applySelected() {
    if (!proposals) return;
    const toApply = proposals.filter((_, i) => selected.has(i));
    const newEvents = [];
    const rescheduled = [];
    const deleted = [];

    toApply.forEach(p => {
      if (p.action === "create") {
        newEvents.push({
          id: uid(), baseId: uid(),
          title: p.title, date: p.date, start: p.start, end: p.end,
          allDay: false, recurring: false, recurrence: { freq:"weekly", interval:1, days:[], until:"" },
          pids: [currentUser], organizer: currentUser,
          reminders: [], important: false, private: false,
          attendees: { [currentUser]: "accepted" }, category: "personal", notes: "",
        });
      } else if (p.action === "reschedule" && p.eventTitle) {
        rescheduled.push(p);
      } else if (p.action === "delete" && p.eventTitle) {
        deleted.push(p);
      }
    });

    onApplyChanges({ newEvents, rescheduled, deleted });
    setStep("analyze");
    setProposals(null);
    setInsights(null);
    onClose();
  }

  function toggleSelect(i) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 800, backdropFilter: "blur(5px)" }}
    >
      <div className="animate-slide-up" style={{ background: T.card, border: `1px solid ${T.b1}`, borderRadius: "20px 20px 0 0", padding: "20px 20px 0", width: "100%", maxWidth: 520, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: `0 -12px 48px ${T.sh}`, ...FF }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.b1, margin: "-8px auto 16px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366F1,#9B5DE5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>Schedule Optimizer</div>
              <div style={{ fontSize: 11, color: T.t2 }}>{step === "propose" ? "Review proposed changes" : "AI-powered analysis"}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.t2, display: "flex" }}><X size={18} /></button>
        </div>

        {/* Range selector — only on analyze step */}
        {step === "analyze" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {RANGE_OPTIONS.map((r, i) => (
              <button key={r.label} onClick={() => { setRangeIdx(i); setInsights(null); }} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: `1.5px solid ${rangeIdx === i ? "#6366F1" : T.b1}`, background: rangeIdx === i ? rgba("#6366F1",0.1) : "transparent", color: rangeIdx === i ? "#6366F1" : T.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", ...FF }}>
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        {step === "analyze" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Events",          value: totalEvents,    color: accent },
              { label: "Busy Days",       value: overloadedDays, color: overloadedDays > 0 ? "#F4881A" : "#4AA96C" },
              { label: "Days Scanned",    value: rangeOpt.days === 0 ? 1 : Object.keys(dayGroups).length, color: T.t1 },
            ].map(s => (
              <div key={s.label} style={{ background: T.bg1, border: `1px solid ${T.b1}`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {error && (
            <div style={{ background: rgba("#E05555",0.07), border: `1px solid ${rgba("#E05555",0.25)}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#E05555", fontWeight: 600 }}>{error}</div>
            </div>
          )}

          {/* Analyze step */}
          {step === "analyze" && !loading && !insights && !error && (
            <div style={{ textAlign: "center", padding: "24px 20px", color: T.t2 }}>
              <Sparkles size={36} color={rgba("#6366F1",0.35)} style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.t1, marginBottom: 6 }}>Ready to analyze</div>
              <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>
                AI will review your {rangeOpt.label.toLowerCase()} and surface recommendations.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${rgba("#6366F1",0.2)}`, borderTop: `3px solid #6366F1`, margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 13, color: T.t2 }}>Analyzing your schedule…</div>
            </div>
          )}

          {propLoading && (
            <div style={{ textAlign: "center", padding: "24px 20px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${rgba("#6366F1",0.2)}`, borderTop: `3px solid #6366F1`, margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontSize: 13, color: T.t2 }}>Drafting proposed changes…</div>
            </div>
          )}

          {/* Insights */}
          {step === "analyze" && insights && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>Recommendations</div>
              {insights.map((ins, i) => {
                const st = insightStyle(ins.type);
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: st.bg, border: `1px solid ${st.border}`, borderRadius: 10, padding: "11px 13px" }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}><InsightIcon type={ins.type} /></div>
                    <div style={{ fontSize: 13, color: T.t0, lineHeight: 1.5 }}>{ins.text}</div>
                  </div>
                );
              })}
              <div style={{ fontSize: 10, color: T.t3, textAlign: "center", marginTop: 4 }}>AI analysis — use your own judgment.</div>
            </div>
          )}

          {/* Proposed changes */}
          {step === "propose" && proposals && !propLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t2, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>
                Proposed Changes — check ones to apply
              </div>
              {proposals.length === 0 && (
                <div style={{ fontSize: 13, color: T.t2, textAlign: "center", padding: "16px 0" }}>No specific changes could be generated. Try re-analyzing.</div>
              )}
              {proposals.map((p, i) => {
                const on = selected.has(i);
                return (
                  <button key={i} onClick={() => toggleSelect(i)} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: on ? rgba("#6366F1",0.07) : T.bg1, border: `1.5px solid ${on ? rgba("#6366F1",0.35) : T.b1}`, borderRadius: 10, padding: "12px 13px", cursor: "pointer", textAlign: "left", width: "100%", ...FF }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${on ? "#6366F1" : T.b1}`, background: on ? "#6366F1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {on && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {changeIcon(p.action)}
                        <span style={{ fontSize: 10, fontWeight: 700, color: p.action === "create" ? "#4AA96C" : p.action === "delete" ? "#E05555" : "#6366F1", textTransform: "uppercase", letterSpacing: ".4px" }}>
                          {p.action}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.t0, marginBottom: 2 }}>
                        {p.eventTitle || p.title}
                        {p.newStart && <span style={{ fontSize: 11, color: T.t2, fontWeight: 400 }}> → {p.newStart}{p.newEnd ? `–${p.newEnd}` : ""}</span>}
                        {p.date && p.action === "create" && <span style={{ fontSize: 11, color: T.t2, fontWeight: 400 }}> {p.date} {p.start}–{p.end}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.4 }}>{p.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div style={{ padding: "14px 0", borderTop: `1px solid ${T.b1}`, background: T.card, display: "flex", gap: 8 }}>
          {step === "analyze" && (
            <>
              <button onClick={runAnalysis} disabled={loading} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: loading ? rgba("#6366F1",0.4) : "linear-gradient(135deg,#6366F1,#9B5DE5)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...FF }}>
                <Sparkles size={15} /> {loading ? "Analyzing…" : insights ? "Re-analyze" : "Analyze Schedule"}
              </button>
              {insights && !loading && (
                <button onClick={runPropose} disabled={propLoading} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${rgba("#6366F1",0.4)}`, background: rgba("#6366F1",0.08), color: "#6366F1", fontSize: 13, fontWeight: 700, cursor: propLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...FF }}>
                  <ChevronRight size={15} /> {propLoading ? "…" : "Changes"}
                </button>
              )}
            </>
          )}
          {step === "propose" && (
            <>
              <button onClick={() => setStep("analyze")} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.b1}`, background: "transparent", color: T.t2, fontSize: 13, fontWeight: 600, cursor: "pointer", ...FF }}>
                Back
              </button>
              <button onClick={applySelected} disabled={selected.size === 0} style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: selected.size > 0 ? "linear-gradient(135deg,#4AA96C,#2A9D8F)" : rgba("#888",0.2), color: "#fff", fontSize: 13, fontWeight: 700, cursor: selected.size > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...FF }}>
                <CheckCircle size={15} /> Apply {selected.size} Change{selected.size !== 1 ? "s" : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
