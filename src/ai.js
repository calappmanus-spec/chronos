async function callAI(userPrompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

export async function parseEventFromText(text, today) {
  const sys = `You convert natural language into calendar events. Today is ${today}. Reply ONLY with a JSON object like: {"title":"...","date":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","allDay":false,"recurring":false,"recurFreq":""}. Default duration 1 hour. If no time given set allDay:true.`;
  try {
    const raw = await callAI(text, sys);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return null;
}

export async function getDailySummary(events, dateStr) {
  if (!events.length) return "Nothing scheduled — enjoy your free day!";
  const list = events.map(e => `${e.title} at ${e.allDay ? "all day" : e.start}`).join(", ");
  const sys = "You are a concise calendar assistant. Summarize in 1-2 friendly sentences. No markdown.";
  try { return await callAI(`Summarize for ${dateStr}: ${list}`, sys); }
  catch { return `${events.length} event${events.length > 1 ? "s" : ""} today`; }
}

export async function getOptimizations(events, dateStr) {
  if (events.length < 2) return ["Your schedule looks clear — great for deep work!"];
  const list = events.map(e => `${e.title} ${e.start}-${e.end}`).join(", ");
  const sys = `Schedule optimizer. Date: ${dateStr}. Reply ONLY with a JSON array of 2-3 short tip strings.`;
  try {
    const raw = await callAI(`Optimize: ${list}`, sys);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return ["Schedule looks good!"];
}
