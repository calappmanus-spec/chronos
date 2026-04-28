import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { DAYS_S, HOURS, HH } from "../../constants.js";
import { TODAY, NOW_H, NOW_M, fmtDate, addDays, weekStart, toMin, minToTime, timeToY, rgba, getProfile } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";
import EventBlock from "../events/EventBlock.jsx";
import DragGhost from "../events/DragGhost.jsx";

const TW = 52; // time-column width px

export default function WeekView({ date, events, tasks = [], onSlot, onEv, reschedule, onLongPress, T, calBg = "transparent", isBgDark = true }) {
  const ws   = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const wsISO = ws.toISOString();
  const expanded = useMemo(() => expandEvents(events, ws, addDays(ws, 6)), [events, wsISO]);
  const [drag, setDrag] = useState(null);
  const scrollRef = useRef(null);
  const nowY = (NOW_H + NOW_M / 60) * HH;

  const tasksByDate = useMemo(() => {
    const m = {};
    (tasks || []).filter(t => t.due && !t.done).forEach(t => { if (!m[t.due]) m[t.due] = []; m[t.due].push(t); });
    return m;
  }, [tasks]);

  function startDrag(e, ev, colIdx) {
    if (!ev.start || !ev.end || ev.allDay) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetMin = Math.floor(((e.clientY - rect.top) / HH) * 60);
    setDrag({ ev, dur: toMin(ev.end) - toMin(ev.start), offsetMin, ghostTop: timeToY(ev.start, HH), ns: ev.start, ne: ev.end, nd: ev.date, ci: colIdx });
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    if (!drag) return;
    function onMouseMove(e) {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top + el.scrollTop;
      const rawMin = Math.round(((y / HH) * 60 - drag.offsetMin) / 15) * 15;
      const cs = Math.max(0, Math.min(23 * 60, rawMin));
      const ce = Math.min(24 * 60 - 1, cs + drag.dur);
      const colW = (rect.width - TW) / 7;
      const ci = Math.max(0, Math.min(6, Math.floor((e.clientX - rect.left - TW) / colW)));
      setDrag(prev => ({ ...prev, ghostTop: cs / 60 * HH, ns: minToTime(cs), ne: minToTime(ce), nd: fmtDate(days[ci]), ci }));
    }
    function onMouseUp() {
      if (drag.ns !== drag.ev.start || drag.nd !== drag.ev.date) {
        reschedule(drag.ev.baseId || drag.ev.id, drag.nd, drag.ns, drag.ne);
      }
      setDrag(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [drag, days]);

  const hasBg      = calBg !== "transparent";
  const gridBorder = hasBg ? (isBgDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)") : T.b0;
  const hdrBg      = hasBg ? (isBgDark ? "rgba(0,0,0,0.25)"      : "rgba(0,0,0,0.05)") : T.bg1;
  const hdrBorder  = hasBg ? (isBgDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)")  : T.b1;
  const hdrLabel   = hasBg ? (isBgDark ? "rgba(255,255,255,0.6)"  : "rgba(0,0,0,0.45)") : T.t2;
  const hdrDate    = hasBg ? (isBgDark ? "rgba(255,255,255,0.9)"  : "rgba(0,0,0,0.75)") : T.t0;
  const timeColor  = hasBg ? (isBgDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.35)") : T.t3;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", position: "relative" }}>
      {/* Header row */}
      <div style={{ display: "flex", background: hdrBg, borderBottom: `1px solid ${hdrBorder}`, flexShrink: 0 }}>
        <div style={{ width: TW, flexShrink: 0 }} />
        {days.map(d => {
          const isToday = fmtDate(d) === TODAY;
          return (
            <div key={d.toString()} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderLeft: `1px solid ${gridBorder}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", color: isToday ? T.red : hdrLabel, textTransform: "uppercase", ...FF }}>{DAYS_S[d.getDay()]}</div>
              <div style={{ fontSize: 18, fontWeight: isToday ? 700 : 300, color: isToday ? T.red : hdrDate, lineHeight: 1.2, ...FF }}>{d.getDate()}</div>
              {(tasksByDate[fmtDate(d)] || []).length > 0 && (
                <div style={{ fontSize: 8, fontWeight: 700, color: "#F4881A", marginTop: 2, ...FF }}>
                  ✓{(tasksByDate[fmtDate(d)] || []).length}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Scrollable time grid */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex" }}>
        <div style={{ width: TW, flexShrink: 0, borderRight: `1px solid ${gridBorder}` }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: HH, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3, fontSize: 10, color: timeColor, boxSizing: "border-box", ...FF }}>
              {h === 0 ? "" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          {days.map((d, ci) => {
            const ds = fmtDate(d);
            const isToday = ds === TODAY;
            const dayEvs  = expanded.filter(e => e.date === ds && !e.allDay);
            return (
              <div
                key={ds}
                onClick={() => !drag && onSlot(ds)}
                style={{ flex: 1, position: "relative", borderLeft: `1px solid ${gridBorder}`, background: isToday ? rgba(T.red, hasBg ? 0.12 : 0.025) : (hasBg ? "transparent" : T.bg) }}
              >
                {HOURS.map(h => <div key={h} style={{ height: HH, borderBottom: `1px solid ${gridBorder}`, boxSizing: "border-box" }} />)}
                {isToday && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: nowY, height: 1.5, background: rgba(T.red, 0.6), zIndex: 5, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", background: T.red }} />
                  </div>
                )}
                {dayEvs.map(ev => {
                  const h = Math.max((toMin(ev.end) - toMin(ev.start)) / 60 * HH, 22);
                  const isFaded = drag && (drag.ev.baseId || drag.ev.id) === (ev.baseId || ev.id);
                  return <EventBlock key={ev.id} ev={ev} top={timeToY(ev.start, HH)} height={h} onClick={onEv} onMouseDown={(e, ev2) => startDrag(e, ev2, ci)} onLongPress={onLongPress} faded={isFaded} />;
                })}
                {drag && drag.ci === ci && (
                  <DragGhost color={getProfile((drag.ev.pids || [])[0] || "jeremy").color} top={drag.ghostTop} height={drag.dur / 60 * HH} title={drag.ev.title} start={drag.ns} end={drag.ne} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
