import { checkRateLimit } from "./lib/security.js";

function getAIConfig() {
  return {
    provider: localStorage.getItem("ch_ai_provider") || "anthropic",
    key:      localStorage.getItem("ch_ai_key")      || "",
  };
}

async function callAI(userPrompt, systemPrompt) {
  const { provider, key } = getAIConfig();
  if (!key) throw new Error("No AI API key configured. Add your key in Settings.");

  // Rate limit: 20 calls/min, 150/hour
  checkRateLimit();

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   },
        ],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || "";
  } else {
    // Anthropic / Claude
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.content?.[0]?.text || "";
  }
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

export async function analyzeSchedule(events, rangeLabel) {
  if (!events || events.length === 0) return [{ type: "tip", text: "Your schedule is clear — great time for deep work or personal projects!" }];
  const list = events.map(e => `${e.date} ${e.allDay ? "all-day" : `${e.start}-${e.end}`}: ${e.title}`).join("\n");
  const sys = `You are a productivity coach analyzing a calendar. Look for: back-to-back meetings, overloaded days (4+ events), lack of breaks, late-night events (after 8pm), fragmented focus time, meeting clustering opportunities.
Reply ONLY with a JSON array of objects like: [{"type":"warning"|"tip"|"success","text":"..."}]. Give 3-5 actionable insights. Be specific about event names/times. Keep each under 25 words.`;
  try {
    const raw = await callAI(`Analyze this schedule for ${rangeLabel}:\n${list}`, sys);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return [{ type: "tip", text: "Schedule looks reasonable! Consider grouping meetings to protect focus blocks." }];
}

export async function proposeScheduleChanges(events, insights, rangeLabel) {
  if (!events || events.length === 0) return [];
  const list = events.map(e => `${e.date} ${e.allDay ? "all-day" : `${e.start}-${e.end}`}: ${e.title} [id:${e.id}]`).join("\n");
  const insightText = insights.map(i => i.text).join("; ");
  const sys = `You are a calendar assistant. Based on the schedule and insights, propose specific calendar changes.
Reply ONLY with a JSON array. Each item must be one of:
- {"action":"reschedule","description":"...","eventTitle":"exact title","newDate":"YYYY-MM-DD or null","newStart":"HH:MM","newEnd":"HH:MM"}
- {"action":"create","description":"...","title":"...","date":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM"}
- {"action":"delete","description":"...","eventTitle":"exact title","date":"YYYY-MM-DD"}
Propose 2-4 specific, actionable changes. Match event titles exactly from the schedule.`;
  try {
    const raw = await callAI(`Schedule for ${rangeLabel}:\n${list}\n\nInsights: ${insightText}\n\nPropose specific changes:`, sys);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return [];
}

export async function generateWorkoutPlan({ level, goal, equipment, duration, daysPerWeek, limitations, startDate, days = 7 }) {
  const sys = `You are a personal trainer. Create a ${days}-day workout plan starting ${startDate}.
Fitness level: ${level}. Goal: ${goal}. Equipment: ${equipment}. Session duration: ${duration} min. Days/week: ${daysPerWeek}. Limitations: ${limitations || "none"}.

Reply ONLY with a valid JSON object. Keys are "YYYY-MM-DD|TimeOfDay" where TimeOfDay is "Morning", "Afternoon", or "Evening".
Values are "Workout Name|||Instructions" where instructions are 3-5 sentences: warm-up, main sets/reps, cool-down.
Rest days should be omitted or use "Rest Day|||Light stretching and recovery. Take a 10-minute walk. Focus on hydration and sleep."
Example: "2026-04-28|Morning": "Upper Body Strength|||Warm up with 5 min light cardio. 3x10 push-ups, 3x10 dumbbell rows, 3x12 shoulder press. 3x15 tricep dips. Cool down with chest and shoulder stretches for 5 minutes."`;
  try {
    const raw = await callAI("Generate the workout plan now.", sys);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return null;
}

export async function optimizeMealsForWorkout(mealData, workoutData, startDate) {
  const meals = Object.entries(mealData).map(([k, v]) => `${k}: ${v}`).join("\n");
  const workouts = Object.entries(workoutData).map(([k, v]) => `${k}: ${v}`).join("\n");
  if (!meals && !workouts) return null;
  const sys = `You are a sports nutritionist. Given a workout schedule and current meal plan, suggest meal optimizations for workout performance and recovery. Optimize pre-workout and post-workout meals specifically.
Reply ONLY with a JSON object in the same format as the meal data: keys are "YYYY-MM-DD|MealType" (Breakfast/Lunch/Dinner), values are "Optimized Meal Name|||Brief nutrition note (1-2 sentences on why this works with the workout)".
Only include meals you want to change/optimize. Keep the same date range as the provided data.`;
  try {
    const raw = await callAI(`Workouts:\n${workouts}\n\nCurrent meals:\n${meals}\n\nOptimize meals for workout performance:`, sys);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return null;
}

export async function suggestGoalSupport(goal, today) {
  const { title, horizon, category, target, unit, notes } = goal;
  const sys = `You are a personal life coach and scheduler. Given a goal, suggest a concrete action plan with supporting calendar events, tasks, meals, and workouts.

Reply ONLY with a valid JSON object with these keys:
- "events": array of {title, date, start, end, allDay, notes} — up to 3 milestone/recurring check-in events starting from ${today}
- "tasks": array of {title, priority: "high"|"medium"|"low", due} — up to 4 actionable tasks
- "meals": object with keys "YYYY-MM-DD|MealType" (Breakfast/Lunch/Dinner), values "Meal Name|||Brief note" — 2-3 days of optimized meals if nutrition-relevant, else empty {}
- "workouts": object with keys "YYYY-MM-DD|TimeOfDay" (Morning/Afternoon/Evening), values "Workout|||Instructions" — 2-3 sessions if fitness-relevant, else empty {}

Be practical and specific. Match the horizon (${horizon}) — daily goals get this-week plans, yearly/5-10 year goals get milestone events spaced over months.`;

  try {
    const raw = await callAI(`Goal: "${title}" | Category: ${category} | Target: ${target} ${unit} | Horizon: ${horizon} | Notes: ${notes || "none"}\n\nSuggest a support plan:`, sys);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        events:   Array.isArray(parsed.events)   ? parsed.events   : [],
        tasks:    Array.isArray(parsed.tasks)     ? parsed.tasks    : [],
        meals:    parsed.meals    && typeof parsed.meals    === "object" ? parsed.meals    : {},
        workouts: parsed.workouts && typeof parsed.workouts === "object" ? parsed.workouts : {},
      };
    }
  } catch { /* fall through */ }
  return { events: [], tasks: [], meals: {}, workouts: {} };
}

export async function generateMealPlan({ people = 2, restrictions = "", preferences = "", startDate, days = 7 }) {
  const sys = `You are a meal planning assistant. Create a ${days}-day meal plan starting from ${startDate}.
Dietary restrictions: ${restrictions || "none"}.
Cuisine preferences: ${preferences || "varied, home-cooked"}.
Servings for: ${people} people.

Reply ONLY with a valid JSON object. Keys are in the format "YYYY-MM-DD|MealType" where MealType is exactly "Breakfast", "Lunch", or "Dinner". Values are strings in the format "Meal Name|||Recipe" where the recipe is 3-5 sentences covering ingredients and preparation steps.
Example key: "2026-04-26|Dinner"
Example value: "Lemon Herb Chicken|||Ingredients: 2 chicken breasts, 1 lemon, garlic, olive oil, rosemary, salt, pepper. Season chicken with salt, pepper, and minced garlic. Heat olive oil in a skillet over medium-high heat. Sear chicken 6 minutes per side until golden. Finish with lemon juice and fresh rosemary."`;
  try {
    const raw = await callAI("Generate the meal plan now.", sys);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* fall through */ }
  return null;
}
