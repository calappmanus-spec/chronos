import { useState, useMemo, useEffect, useRef } from "react";
import { DAYS_S, MONTHS_S, HOURS, HH } from "../../constants.js";
import { TODAY, NOW_H, NOW_M, fmtDate, toMin, minToTime, timeToY, rgba, getProfile, weatherInfo } from "../../utils.js";
import { expandEvents } from "../../data.js";
import { FF } from "../../theme.js";
import EventPill from "../events/EventPill.jsx";
import EventBlock from "../events/EventBlock.jsx";
import DragGhost from "../events/DragGhost.jsx";

export default function DayView({ date, events, onSlot, onEv, reschedule, onLongPress, weatherCurrent, T, calBg = "transparent", isBgDark = true }) {
  const ds = fmtDate(date);
  const isToday = ds === TODAY;
  const expanded  = useMemo(() => expandEvents(events, new Date(date), new Date(date)), [events, ds]);
  const dayEvs    = expanded.filter(e => e.date === ds && !e.allDay);
  const allDayEvs = expanded.filter(e => e.date === ds && e.allDay);
  const [drag, setDrag] = useState(null);
  const scrollRef = useRef(null);
  const nowY = (NOW_H + NOW_M / 60) * HH;

  function startDrag(e, ev) {
    if (!ev.start || !ev.end) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDrag({ ev, dur: toMin(ev.end) - toMin(ev.start), offsetMin: Math.floor(((e.clientY - rect.top) / HH) * 60), ghostTop: timeToY(ev.start, HH), ns: ev.start, ne: ev.end });
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
      const cs = Math.max(0, Math.min(23 * 60, Math.round(((y / HH) * 60 - drag.offsetMin) / 15) * 15));
      setDrag(prev => ({ ...prev, ghostTop: cs / 60 * HH, ns: minToTime(cs), ne: minToTime(Math.min(24 * 60 - 1, cs + prev.dur)) }));
    }
    function onMouseUp() {
      if (drag.ns !== drag.ev.start) reschedule(drag.ev.baseId || drag.ev.id, ds, drag.ns, drag.ne);
      setDrag(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [drag, ds]);

  const hasBg      = calBg !== "transparent";
  const gridBorder = hasBg ? (isBgDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)")  : T.b0;
  const hdrBg      = hasBg ? (isBgDark ? "rgba(0,0,0,0.25)"       : "rgba(0,0,0,0.05)") : T.bg1;
  const hdrBorder  = hasBg ? (isBgDark ? "rgba(255,255,255,0.12)"  : "rgba(0,0,0,0.1)")  : T.b1;
  const hdrLabel   = hasBg ? (isBgDark ? "rgba(255,255,255,0.6)"   : "rgba(0,0,0,0.45)") : T.t2;
  const timeColor  = hasBg ? (isBgDark ? "rgba(255,255,255,0.4)"   : "rgba(0,0,0,0.35)") : T.t3;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", position: "relative" }}>
      <div style={{ background: hdrBg, borderBottom: `1px solid ${hdrBorder}`, flexShrink: 0, textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".6px", color: isToday ? T.red : hdrLabel, textTransform: "uppercase", ...FF }}>{DAYS_S[date.getDay()]}</div>
        <div style={{ fontSize: 22, fontWeight: isToday ? 700 : 300, color: isToday ? T.red : T.t0, lineHeight: 1.2, ...FF }}>
          {date.getDate()} <span style={{ fontSize: 14, fontWeight: 400, color: T.t2 }}>{MONTHS_S[date.getMonth()]}</span>
        </div>
        {/* Weather strip — only on today */}
        {isToday && weatherCurrent && (() => {
          const { icon, label } = weatherInfo(weatherCurrent.weather_code);
          const temp   = Math.round(weatherCurrent.temperature_2m);
          const feels  = Math.round(weatherCurrent.apparent_temperature);
          return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "6px 16px 10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 22, fontWeight: 200, color: hasBg ? (isBgDark ? "#fff" : "#1a1a2e") : T.t0, lineHeight: 1, ...FF }}>{temp}°F</div>
                <div style={{ fontSize: 11, color: hasBg ? (isBgDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)") : T.t2, ...FF }}>{label} · Feels {feels}°</div>
              </div>
            </div>
          );
        })()}
        {allDayEvs.length > 0 && (
          <div style={{ display: "flex", gap: 5, padding: "5px 12px 10px", flexWrap: "wrap", justifyContent: "center" }}>
            {allDayEvs.map(ev => <EventPill key={ev.id} ev={ev} onClick={onEv} />)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ width: 52, flexShrink: 0, borderRight: `1px solid ${gridBorder}`, overflow: "hidden" }} />
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", marginLeft: -52, display: "flex" }}>
          <div style={{ width: 52, flexShrink: 0, borderRight: `1px solid ${gridBorder}` }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: HH, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingRight: 8, paddingTop: 3, fontSize: 10, color: timeColor, boxSizing: "border-box", ...FF }}>
                {h === 0 ? "" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
              </div>
            ))}
          </div>
          <div onClick={() => !drag && onSlot(ds)} style={{ flex: 1, position: "relative", background: hasBg ? "transparent" : T.bg }}>
            {HOURS.map(h => <div key={h} style={{ height: HH, borderBottom: `1px solid ${gridBorder}`, boxSizing: "border-box" }} />)}
            {isToday && (
              <div style={{ position: "absolute", left: 0, right: 0, top: nowY, height: 1.5, background: rgba(T.red, 0.6), zIndex: 5, pointerEvents: "none" }}>
                <div style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", background: T.red }} />
              </div>
            )}
            {dayEvs.map(ev => {
              const h = Math.max((toMin(ev.end) - toMin(ev.start)) / 60 * HH, 24);
              const isFaded = drag && (drag.ev.baseId || drag.ev.id) === (ev.baseId || ev.id);
              return <EventBlock key={ev.id} ev={ev} top={timeToY(ev.start, HH)} height={h} onClick={onEv} onMouseDown={startDrag} onLongPress={onLongPress} faded={isFaded} />;
            })}
            {drag && <DragGhost color={getProfile((drag.ev.pids || [])[0] || "jeremy").color} top={drag.ghostTop} height={drag.dur / 60 * HH} title={drag.ev.title} start={drag.ns} end={drag.ne} />}
          </div>
        </div>
      </div>
    </div>
  );
}
