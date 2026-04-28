import { useState } from "react";
import { Target, Flame, Calendar, Mountain, Dumbbell, UtensilsCrossed, Briefcase, User, DollarSign, Sparkles, CheckCircle, ArrowRight, Plus } from "lucide-react";
import { TODAY, uid, rgba } from "../../utils.js";
import { FF } from "../../theme.js";

const HORIZONS = [
  { id:"daily",   label:"Daily",   Icon:Flame,    color:"#4AA96C", desc:"Small daily wins that build momentum" },
  { id:"weekly",  label:"Weekly",  Icon:Calendar, color:"#6366F1", desc:"Focus areas for the week ahead" },
  { id:"monthly", label:"Monthly", Icon:Target,   color:"#F4881A", desc:"Goals you can hit in 30 days" },
  { id:"yearly",  label:"Yearly",  Icon:Mountain, color:"#9B5DE5", desc:"Big aims for the year" },
  { id:"5year",   label:"5-Year",  Icon:Mountain, color:"#0096C7", desc:"Where you want to be in 5 years" },
  { id:"10year",  label:"10-Year", Icon:Mountain, color:"#E05555", desc:"Your decade-long vision" },
];

const CATEGORIES = [
  { id:"fitness",   label:"Fitness",   Icon:Dumbbell,        color:"#6366F1", example:"Run a 5K, lose 10 lbs, do yoga 3x/week" },
  { id:"nutrition", label:"Nutrition", Icon:UtensilsCrossed, color:"#4AA96C", example:"Meal prep Sundays, drink more water, cut sugar" },
  { id:"work",      label:"Work",      Icon:Briefcase,       color:"#F4881A", example:"Get promoted, launch a project, learn a skill" },
  { id:"personal",  label:"Personal",  Icon:User,            color:"#9B5DE5", example:"Read 12 books, meditate daily, learn guitar" },
  { id:"financial", label:"Financial", Icon:DollarSign,      color:"#E8A020", example:"Save $10K, pay off debt, invest monthly" },
];

const STARTER_GOALS = [
  { title:"Drink 8 glasses of water daily",  horizon:"daily",   category:"nutrition", target:8,   unit:"glasses", current:0 },
  { title:"Exercise 3 times this week",       horizon:"weekly",  category:"fitness",   target:3,   unit:"sessions",current:0 },
  { title:"Read for 20 minutes each day",     horizon:"daily",   category:"personal",  target:20,  unit:"min",     current:0 },
  { title:"Save $500 this month",             horizon:"monthly", category:"financial", target:500, unit:"$",       current:0 },
  { title:"Complete one online course",       horizon:"monthly", category:"work",      target:1,   unit:"course",  current:0 },
  { title:"Run a 5K",                         horizon:"monthly", category:"fitness",   target:5,   unit:"km",      current:0 },
  { title:"Cook at home 5 nights per week",   horizon:"weekly",  category:"nutrition", target:5,   unit:"nights",  current:0 },
  { title:"Reach $50K savings",               horizon:"yearly",  category:"financial", target:50000,unit:"$",      current:0 },
];

// ─── Step indicators ──────────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
      {Array.from({length:total},(_,i)=>(
        <div key={i} style={{ width:i===current?20:8, height:8, borderRadius:4, background:i===current?"#6366F1":i<current?rgba("#6366F1",0.4):"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
      ))}
    </div>
  );
}

export default function GoalsOnboarding({ T, accent, onComplete }) {
  const [step,       setStep]       = useState(0);
  const [categories, setCategories] = useState([]);
  const [selected,   setSelected]   = useState(new Set());
  const [custom,     setCustom]     = useState({ title:"", horizon:"monthly", category:"personal", target:100, unit:"", current:0 });
  const [showCustom, setShowCustom] = useState(false);

  const totalSteps = 4;

  function toggleGoal(g) {
    const k = g.title;
    setSelected(s => { const n=new Set(s); n.has(k)?n.delete(k):n.add(k); return n; });
  }

  function finish() {
    const goals = STARTER_GOALS
      .filter(g => selected.has(g.title))
      .map(g => ({ ...g, id:uid(), done:false, notes:"", deadline:"", createdAt:TODAY }));

    if (showCustom && custom.title.trim()) {
      goals.push({ ...custom, id:uid(), done:false, notes:"", deadline:"", createdAt:TODAY, title:custom.title.trim() });
    }

    localStorage.setItem("ch_goals_onboarded", "true");
    onComplete(goals);
  }

  const relevantGoals = STARTER_GOALS.filter(g =>
    categories.length === 0 || categories.includes(g.category)
  );

  const inp = { background:T.bg1, border:`1px solid ${T.b1}`, borderRadius:8, padding:"8px 11px", color:T.t0, fontSize:13, outline:"none", boxSizing:"border-box", width:"100%", ...FF };

  const slides = [
    // Step 0 — Welcome / explain
    <div key={0} style={{textAlign:"center", maxWidth:480, margin:"0 auto", padding:"0 4px"}}>
      <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#6366F1,#9B5DE5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 12px 32px ${rgba("#6366F1",0.35)}`}}>
        <Target size={36} color="#fff"/>
      </div>
      <div style={{fontSize:24,fontWeight:800,color:T.t0,marginBottom:8,letterSpacing:"-0.5px"}}>Set goals.<br/>Live intentionally.</div>
      <div style={{fontSize:14,color:T.t2,lineHeight:1.65,marginBottom:28}}>
        Chronos Goals help you bridge the gap between where you are and where you want to be — from daily habits to your 10-year vision.
      </div>

      {/* Horizon showcase */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:28,textAlign:"left"}}>
        {HORIZONS.map(h=>(
          <div key={h.id} style={{display:"flex",alignItems:"flex-start",gap:10,background:T.bg1,border:`1px solid ${T.b1}`,borderRadius:12,padding:"10px 12px"}}>
            <div style={{width:30,height:30,borderRadius:9,background:rgba(h.color,0.12),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <h.Icon size={15} color={h.color}/>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:T.t0}}>{h.label}</div>
              <div style={{fontSize:10,color:T.t2,lineHeight:1.4}}>{h.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setStep(1)} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366F1,#9B5DE5)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,...FF}}>
        Get started <ArrowRight size={17}/>
      </button>
    </div>,

    // Step 1 — Pick focus areas
    <div key={1} style={{maxWidth:480,margin:"0 auto",padding:"0 4px"}}>
      <div style={{textAlign:"center",marginBottom:22}}>
        <div style={{fontSize:20,fontWeight:800,color:T.t0,marginBottom:6}}>What matters most to you?</div>
        <div style={{fontSize:13,color:T.t2}}>Pick the areas you want to focus on (choose all that apply).</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {CATEGORIES.map(c=>{
          const on=categories.includes(c.id);
          return(
            <button key={c.id} onClick={()=>setCategories(p=>on?p.filter(x=>x!==c.id):[...p,c.id])} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,border:`2px solid ${on?c.color:T.b1}`,background:on?rgba(c.color,0.08):T.bg1,cursor:"pointer",textAlign:"left",...FF}}>
              <div style={{width:38,height:38,borderRadius:11,background:rgba(c.color,0.12),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <c.Icon size={18} color={c.color}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:T.t0}}>{c.label}</div>
                <div style={{fontSize:11,color:T.t2,lineHeight:1.4}}>{c.example}</div>
              </div>
              {on&&<CheckCircle size={18} color={c.color}/>}
            </button>
          );
        })}
      </div>
      <button onClick={()=>setStep(2)} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:categories.length>0?"linear-gradient(135deg,#6366F1,#9B5DE5)":rgba("#888",0.2),color:"#fff",fontSize:14,fontWeight:700,cursor:categories.length>0?"pointer":"not-allowed",...FF}}>
        {categories.length>0?`Continue with ${categories.length} area${categories.length>1?"s":""}` : "Select at least one area"}
      </button>
      <button onClick={()=>setStep(2)} style={{display:"block",width:"100%",background:"none",border:"none",color:T.t3,fontSize:12,cursor:"pointer",marginTop:10,padding:"6px 0",...FF}}>Skip — I'll add goals manually</button>
    </div>,

    // Step 2 — Pick starter goals
    <div key={2} style={{maxWidth:480,margin:"0 auto",padding:"0 4px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:800,color:T.t0,marginBottom:6}}>Pick your first goals</div>
        <div style={{fontSize:13,color:T.t2}}>Select the ones that resonate — you can always add more later.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
        {relevantGoals.map(g=>{
          const on=selected.has(g.title);
          const hor=HORIZONS.find(h=>h.id===g.horizon);
          const cat=CATEGORIES.find(c=>c.id===g.category);
          return(
            <button key={g.title} onClick={()=>toggleGoal(g)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:13,border:`2px solid ${on?(hor?.color||accent):T.b1}`,background:on?rgba(hor?.color||accent,0.07):T.bg1,cursor:"pointer",textAlign:"left",...FF}}>
              <div style={{width:32,height:32,borderRadius:9,background:rgba(cat?.color||"#888",0.12),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {cat&&<cat.Icon size={15} color={cat.color}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:T.t0}}>{g.title}</div>
                <div style={{display:"flex",gap:5,marginTop:3}}>
                  <span style={{fontSize:9,fontWeight:700,color:hor?.color,background:rgba(hor?.color||"#888",0.1),padding:"1px 6px",borderRadius:8,textTransform:"uppercase"}}>{hor?.label}</span>
                  <span style={{fontSize:9,color:T.t3}}>Target: {g.target} {g.unit}</span>
                </div>
              </div>
              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${on?(hor?.color||accent):T.b1}`,background:on?(hor?.color||accent):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                {on&&<CheckCircle size={13} color="#fff" strokeWidth={2.5}/>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom goal */}
      <button onClick={()=>setShowCustom(s=>!s)} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:12,border:`1.5px dashed ${T.b1}`,background:"transparent",color:T.t2,fontSize:12,fontWeight:600,cursor:"pointer",width:"100%",marginBottom:12,...FF}}>
        <Plus size={14}/> Add a custom goal
      </button>
      {showCustom&&(
        <div style={{background:T.bg1,border:`1px solid ${T.b1}`,borderRadius:13,padding:14,marginBottom:14}}>
          <input value={custom.title} onChange={e=>setCustom(p=>({...p,title:e.target.value}))} placeholder="My goal…" style={{...inp,marginBottom:8,fontSize:14,fontWeight:600}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:T.t3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Horizon</div>
              <select value={custom.horizon} onChange={e=>setCustom(p=>({...p,horizon:e.target.value}))} style={inp}>
                {HORIZONS.map(h=><option key={h.id} value={h.id}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:700,color:T.t3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Unit</div>
              <input value={custom.unit} onChange={e=>setCustom(p=>({...p,unit:e.target.value}))} placeholder="km, $, days…" style={inp}/>
            </div>
          </div>
        </div>
      )}

      <button onClick={()=>setStep(3)} disabled={selected.size===0&&(!showCustom||!custom.title.trim())} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:(selected.size>0||(showCustom&&custom.title.trim()))?"linear-gradient(135deg,#6366F1,#9B5DE5)":rgba("#888",0.2),color:"#fff",fontSize:14,fontWeight:700,cursor:(selected.size>0||(showCustom&&custom.title.trim()))?"pointer":"not-allowed",...FF}}>
        {selected.size>0||showCustom?`Add ${selected.size+(showCustom&&custom.title.trim()?1:0)} goal${(selected.size+(showCustom&&custom.title.trim()?1:0))!==1?"s":""}` : "Select at least one goal"}
      </button>
    </div>,

    // Step 3 — AI plan + finish
    <div key={3} style={{textAlign:"center",maxWidth:440,margin:"0 auto",padding:"0 4px"}}>
      <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#4AA96C,#2A9D8F)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 12px 32px ${rgba("#4AA96C",0.3)}`}}>
        <Sparkles size={34} color="#fff"/>
      </div>
      <div style={{fontSize:22,fontWeight:800,color:T.t0,marginBottom:8}}>You're all set!</div>
      <div style={{fontSize:14,color:T.t2,lineHeight:1.65,marginBottom:24}}>
        Your {selected.size+(showCustom&&custom.title.trim()?1:0)} goal{(selected.size+(showCustom&&custom.title.trim()?1:0))!==1?"s are":"is"} ready to track.
      </div>
      <div style={{background:T.bg1,border:`1px solid ${T.b1}`,borderRadius:16,padding:"16px 18px",marginBottom:24,textAlign:"left"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <Sparkles size={14} color="#6366F1"/>
          <span style={{fontSize:12,fontWeight:700,color:T.t0}}>AI-powered goal support</span>
        </div>
        <div style={{fontSize:12,color:T.t2,lineHeight:1.6}}>
          After setup, tap <strong>"Suggest Plan"</strong> on any goal card to have AI automatically create supporting calendar events, workouts, meals, and tasks — customized to your goal.
        </div>
      </div>
      <button onClick={finish} style={{width:"100%",padding:"14px 0",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366F1,#9B5DE5)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,...FF}}>
        Go to my Goals <ArrowRight size={17}/>
      </button>
    </div>,
  ];

  return (
    <div onClick={e=>e.target===e.currentTarget&&step>0&&setStep(s=>s-1)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,backdropFilter:"blur(6px)",padding:"20px 16px",overflowY:"auto"}}>
      <div className="animate-pop" style={{background:T.card,border:`1px solid ${T.b1}`,borderRadius:24,padding:"28px 22px 22px",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",...FF}}>
        <Steps current={step} total={totalSteps}/>
        {slides[step]}
        {step>0&&step<3&&(
          <button onClick={()=>setStep(s=>s-1)} style={{display:"block",width:"100%",background:"none",border:"none",color:T.t3,fontSize:12,cursor:"pointer",marginTop:12,padding:"6px 0",...FF}}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
