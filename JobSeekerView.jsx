// JobSeekerView.jsx — Browse + Filter + Detail + Apply + Saved + Profile

const JOBS = [
  { id:1, title:"Senior Product Designer", company:"Notion", logo:"N", logoColor:"#000", location:"San Francisco, CA", remote:"Remote", type:"Full-time", salary:"$140k–$180k", experience:"Senior", industry:"Software", posted:"3 days ago", applicants:42, lastVerified:0.3, tags:["Figma","Design Systems","User Research"], desc:"We're looking for a Senior Product Designer to shape the future of Notion's core editor experience. You'll work closely with PMs and engineers to take features from concept to launch.", match:96 },
  { id:2, title:"Frontend Engineer", company:"Linear", logo:"L", logoColor:"#5E6AD2", location:"New York, NY", remote:"Hybrid", type:"Full-time", salary:"$160k–$210k", experience:"Senior", industry:"Software", posted:"1 day ago", applicants:18, lastVerified:0.1, tags:["React","TypeScript","GraphQL"], desc:"Build the fastest issue tracker on the planet. You'll own key parts of our web app, work with a small tight-knit team, and ship things that matter.", match:91 },
  { id:3, title:"Growth Marketing Manager", company:"Loom", logo:"Lo", logoColor:"#625DF5", location:"Remote", remote:"Remote", type:"Full-time", salary:"$110k–$145k", experience:"Mid-level", industry:"Marketing", posted:"5 days ago", applicants:87, lastVerified:1.2, tags:["SEO","Paid Acquisition","Analytics"], desc:"Own acquisition channels and run experiments that directly impact Loom's growth. You'll have real autonomy and a generous budget to move fast.", match:78 },
  { id:4, title:"Staff Backend Engineer", company:"Stripe", logo:"S", logoColor:"#635BFF", location:"Seattle, WA", remote:"On-site", type:"Full-time", salary:"$220k–$280k", experience:"Senior", industry:"Fintech", posted:"2 days ago", applicants:31, lastVerified:0.5, tags:["Go","Distributed Systems","APIs"], desc:"Design and build the infrastructure that processes billions of dollars in payments globally. You'll lead technical direction and mentor a team of engineers.", match:88 },
  { id:5, title:"Product Manager, Growth", company:"Figma", logo:"F", logoColor:"#F24E1E", location:"San Francisco, CA", remote:"Hybrid", type:"Full-time", salary:"$170k–$220k", experience:"Senior", industry:"Software", posted:"6 hours ago", applicants:11, lastVerified:0.05, tags:["Growth","A/B Testing","Analytics"], desc:"Lead growth initiatives for Figma's core product. Partner with design, engineering, and data to run experiments that unlock the next phase of user acquisition.", match:82 },
  { id:6, title:"Data Scientist", company:"Airbnb", logo:"A", logoColor:"#FF5A5F", location:"San Francisco, CA", remote:"Hybrid", type:"Full-time", salary:"$155k–$195k", experience:"Mid-level", industry:"Tech", posted:"4 days ago", applicants:64, lastVerified:2.1, tags:["Python","SQL","ML"], desc:"Use data to understand how hosts and guests behave on our platform. Build models that personalize the Airbnb experience at scale.", match:74 },
  { id:7, title:"DevOps Engineer", company:"Vercel", logo:"▲", logoColor:"#000", location:"Remote", remote:"Remote", type:"Contract", salary:"$90–$130/hr", experience:"Senior", industry:"Infrastructure", posted:"2 days ago", applicants:23, lastVerified:0.8, tags:["Kubernetes","AWS","CI/CD"], desc:"Help scale Vercel's edge infrastructure to handle millions of deployments. You'll work on systems that directly impact thousands of developers worldwide.", match:85 },
  { id:8, title:"Content Strategist", company:"Webflow", logo:"W", logoColor:"#4353FF", location:"Remote", remote:"Remote", type:"Part-time", salary:"$60k–$80k", experience:"Mid-level", industry:"Marketing", posted:"1 day ago", applicants:34, lastVerified:0.2, tags:["Content Marketing","SEO","Copywriting"], desc:"Shape the voice of Webflow's brand across blog, social, and email. You'll partner with design and product to tell the story of the no-code movement.", match:70 },
];

const SAVED_IDS_INIT = [1, 4, 7];

const INDUSTRIES = ["All Industries","Software","Fintech","Marketing","Tech","Infrastructure"];
const EXPERIENCE_LEVELS = ["Any Level","Entry-level","Mid-level","Senior","Staff"];
const JOB_TYPES = ["Any Type","Full-time","Part-time","Contract"];
const REMOTE_OPTIONS = ["Any","Remote","Hybrid","On-site"];
const FRESHNESS = ["Any","< 24h","< 3 days","< 1 week"];

// ─── Normalise a Supabase job row into the shape the UI expects ───────────────
function normalizeJob(j) {
  const co = j.companies || {};
  const name = co.name || 'Company';
  const palette = ['#5E6AD2','#625DF5','#635BFF','#F24E1E','#FF5A5F','#4353FF','#000'];
  const remoteMap = { remote:'Remote', hybrid:'Hybrid', 'on-site':'On-site' };
  const expMap = { Entry:'Entry-level', Mid:'Mid-level', Senior:'Senior', Lead:'Staff' };
  return {
    ...j,
    company: name,
    logo: name.substring(0, 2).toUpperCase(),
    logoColor: palette[name.charCodeAt(0) % palette.length],
    lastVerified: (Date.now() - new Date(j.last_verified_at)) / 864e5,
    tags: Array.isArray(j.skills) ? j.skills : [],
    salary: j.salary_text || (j.salary_min ? `$${Math.floor(j.salary_min/1000)}k–$${Math.floor(j.salary_max/1000)}k` : 'Competitive'),
    posted: formatPostedDate(j.posted_at || j.created_at),
    remote: remoteMap[j.remote] || j.remote || 'Remote',
    experience: expMap[j.experience] || j.experience || 'Senior',
    type: j.type || 'Full-time',
    applicants: j.applications?.[0]?.count ?? j.applicants ?? 0,
    match: null,
    desc: j.description || '',
    industry: j.industry || co.industry || 'Other',
  };
}

function formatPostedDate(dateStr) {
  if (!dateStr) return 'Recently';
  const hours = (Date.now() - new Date(dateStr)) / 36e5;
  if (hours < 1)  return 'Just posted';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const d = Math.floor(hours / 24);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

function verifiedLabel(days) {
  if (days < 0.08) return { label:"Just verified", color:"#10b981", bg:"#d1fae5", dot:"#10b981" };
  if (days < 1)    return { label:`Verified ${Math.round(days*24)}h ago`, color:"#10b981", bg:"#d1fae5", dot:"#10b981" };
  if (days < 3)    return { label:`Verified ${Math.floor(days)}d ago`, color:"#f59e0b", bg:"#fef3c7", dot:"#f59e0b" };
  return               { label:`Verified ${Math.floor(days)}d ago`, color:"#ef4444", bg:"#fee2e2", dot:"#ef4444" };
}

function matchColor(pct) {
  if (pct >= 90) return "#10b981";
  if (pct >= 75) return "var(--wq-accent)";
  return "var(--wq-faint)";
}

// ─── Shared saved state ───────────────────────────────────────────────────────
let _savedIds = [...SAVED_IDS_INIT];
let _savedListeners = [];
function toggleSaved(id) {
  const wasIn = _savedIds.includes(id);
  _savedIds = wasIn ? _savedIds.filter(x => x !== id) : [..._savedIds, id];
  _savedListeners.forEach(fn => fn([..._savedIds]));
  // Persist to DB if connected
  if (window.WQApi && getSupabase()) {
    if (wasIn) WQApi.unsaveJob(id).catch(console.error);
    else       WQApi.saveJob(id).catch(console.error);
  }
}
function useSaved() {
  const [ids, setIds] = React.useState(_savedIds);
  React.useEffect(() => {
    _savedListeners.push(setIds);
    // Load saved IDs from DB on first mount if connected
    if (window.WQApi && getSupabase()) {
      WQApi.getSavedJobIds().then(set => {
        _savedIds = [...set];
        _savedListeners.forEach(fn => fn([..._savedIds]));
      }).catch(() => {});
    }
    return () => { _savedListeners = _savedListeners.filter(fn => fn !== setIds); };
  }, []);
  return [ids, toggleSaved];
}

// ─── JobCard ─────────────────────────────────────────────────────────────────
function JobCard({ job, selected, onClick, savedIds, onToggleSave }) {
  const v = verifiedLabel(job.lastVerified);
  const isSaved = savedIds && savedIds.includes(job.id);
  return (
    <div onClick={onClick} style={{
      background: selected ? "var(--wq-accent-bg)" : "var(--wq-surface)",
      border: `2px solid ${selected ? "var(--wq-accent)" : "var(--wq-border)"}`,
      borderRadius: 14, padding: "20px 22px", cursor: "pointer",
      boxShadow: selected ? "0 4px 20px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
      transition: "all 0.18s ease", position: "relative",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:12 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:job.logoColor+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:job.logoColor, flexShrink:0, fontFamily:"Sora,sans-serif" }}>{job.logo}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:15, color:"var(--wq-text)", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{job.title}</div>
          <div style={{ fontSize:13, color:"var(--wq-muted)" }}>{job.company} · {job.location}</div>
        </div>
        {job.match !== null && (
          <div style={{ fontSize:12, fontWeight:600, borderRadius:20, padding:"3px 9px", flexShrink:0, background:"var(--wq-chip)" }}>
            <span style={{ color:matchColor(job.match) }}>{job.match}% match</span>
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, background:v.bg, borderRadius:20, padding:"4px 10px" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:v.dot }} />
          <span style={{ fontSize:11, fontWeight:600, color:v.color }}>{v.label}</span>
        </div>
        <span style={{ fontSize:11, color:"var(--wq-faint)" }}>· {job.posted}</span>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {[job.type, job.remote, job.salary, job.experience].filter(Boolean).map(t => (
          <span key={t} style={{ fontSize:11, color:"var(--wq-chip-text)", background:"var(--wq-chip)", borderRadius:6, padding:"3px 8px" }}>{t}</span>
        ))}
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {(job.tags||[]).map(tag => (
          <span key={tag} style={{ fontSize:11, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:6, padding:"3px 8px", fontWeight:500 }}>{tag}</span>
        ))}
      </div>
      <div style={{ position:"absolute", top:14, right:14, display:"flex", gap:6, alignItems:"center" }}>
        <button onClick={e => { e.stopPropagation(); onToggleSave && onToggleSave(job.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, opacity: isSaved ? 1 : 0.35, transition:"opacity 0.15s" }} title={isSaved ? "Unsave" : "Save"}>🔖</button>
        <span style={{ fontSize:11, color:"var(--wq-faint)" }}>{job.applicants}</span>
      </div>
    </div>
  );
}

// ─── FilterBar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, setFilters }) {
  const sel = (field, val) => ({
    background: filters[field] === val ? "var(--wq-accent)" : "var(--wq-surface)",
    color: filters[field] === val ? "#fff" : "var(--wq-chip-text)",
    border: `1.5px solid ${filters[field] === val ? "var(--wq-accent)" : "var(--wq-border)"}`,
    borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:500,
    cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s",
  });
  const Group = ({ label, field, options }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {options.map(o => <button key={o} style={sel(field,o)} onClick={() => setFilters(f=>({...f,[field]:o}))}>{o}</button>)}
      </div>
    </div>
  );
  return (
    <div style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:14, padding:"18px 22px", display:"flex", flexDirection:"column", gap:14 }}>
      <Group label="Job Type"        field="type"       options={JOB_TYPES} />
      <Group label="Work Style"      field="remote"     options={REMOTE_OPTIONS} />
      <Group label="Experience"      field="experience" options={EXPERIENCE_LEVELS} />
      <Group label="Industry"        field="industry"   options={INDUSTRIES} />
      <Group label="Verified Within" field="freshness"  options={FRESHNESS} />
    </div>
  );
}

// ─── JobDetail panel ─────────────────────────────────────────────────────────
function JobDetail({ job, onClose, onApply, savedIds, onToggleSave }) {
  const v = verifiedLabel(job.lastVerified);
  const isSaved = savedIds && savedIds.includes(job.id);
  return (
    <div style={{ position:"absolute", top:0, right:0, width:420, height:"100%", background:"var(--wq-surface)", borderLeft:"1.5px solid var(--wq-border)", display:"flex", flexDirection:"column", zIndex:10, animation:"slideIn 0.22s ease" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div style={{ padding:"24px 26px 20px", borderBottom:"1px solid var(--wq-border-light)" }}>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--wq-faint)", fontSize:20, float:"right", marginTop:-4 }}>✕</button>
        <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16 }}>
          <div style={{ width:52, height:52, borderRadius:13, background:job.logoColor+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:job.logoColor, fontFamily:"Sora,sans-serif" }}>{job.logo}</div>
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:18, color:"var(--wq-text)" }}>{job.title}</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)" }}>{job.company} · {job.location}</div>
          </div>
        </div>
        <div style={{ background:v.bg, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:v.dot, boxShadow:`0 0 0 3px ${v.dot}33` }} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:v.color }}>Actively Recruiting — {v.label}</div>
            <div style={{ fontSize:11, color:v.color+"bb" }}>Next verification due in {Math.max(0,7-job.lastVerified).toFixed(0)}d.</div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 26px" }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
          {[job.type,job.remote,job.salary,job.experience,job.industry].filter(Boolean).map(t=>(
            <span key={t} style={{ fontSize:12, color:"var(--wq-chip-text)", background:"var(--wq-chip)", borderRadius:7, padding:"5px 10px" }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:8 }}>About the Role</div>
        <p style={{ fontSize:14, lineHeight:1.7, color:"var(--wq-muted)", marginBottom:20 }}>{job.desc || job.description || 'No description provided.'}</p>
        {(job.tags||[]).length > 0 && (
          <>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:8 }}>Skills</div>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:20 }}>
              {job.tags.map(tag=>(
                <span key={tag} style={{ fontSize:12, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:7, padding:"5px 10px", fontWeight:500 }}>{tag}</span>
              ))}
            </div>
          </>
        )}
        <div style={{ background:"var(--wq-surface2)", border:"1.5px solid var(--wq-border-light)", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:12, color:"var(--wq-text)", marginBottom:10 }}>Quick Stats</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              ["Applicants", job.applicants],
              ["Posted", job.posted],
              ...(job.match !== null ? [["Match", job.match+"%"]] : []),
              ["Verified", job.lastVerified<1 ? Math.round(job.lastVerified*24)+"h ago" : Math.floor(job.lastVerified)+"d ago"],
            ].map(([k,vv])=>(
              <div key={k}><div style={{ fontSize:10, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.5 }}>{k}</div><div style={{ fontSize:14, fontWeight:600, color:"var(--wq-text)" }}>{vv}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 26px", borderTop:"1px solid var(--wq-border-light)", display:"flex", gap:10 }}>
        <button onClick={onApply} style={{ flex:1, background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:10, padding:"13px 0", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"Sora,sans-serif" }}>One-Click Apply ⚡</button>
        <button onClick={() => onToggleSave && onToggleSave(job.id)} style={{ background:"var(--wq-chip)", color:"var(--wq-muted)", border:"none", borderRadius:10, padding:"13px 14px", fontSize:14, cursor:"pointer" }}>{isSaved ? "🔖" : "🔖"}</button>
      </div>
    </div>
  );
}

// ─── ApplyModal ───────────────────────────────────────────────────────────────
function ApplyModal({ job, onClose }) {
  const [step, setStep] = React.useState(0);
  const [coverNote, setCoverNote] = React.useState("");
  const [profile, setProfile] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const steps = ["Review Profile","Cover Note","Submit"];

  React.useEffect(() => {
    if (window.WQApi && getSupabase()) {
      WQApi.getSeekerProfile().then(p => { if (p) setProfile(p); }).catch(() => {});
    }
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (window.WQApi && getSupabase()) {
        await WQApi.applyToJob(job.id, coverNote);
      }
    } catch(e) {
      console.error('Apply failed:', e.message);
    }
    setSubmitting(false);
    setStep(2);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--wq-modal-overlay)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"var(--wq-surface)", borderRadius:18, padding:"32px 36px", width:460, boxShadow:"0 24px 60px rgba(0,0,0,0.2)", position:"relative" }}>
        <div style={{ display:"flex", gap:8, marginBottom:24, alignItems:"center" }}>
          {steps.map((s,i) => (
            <React.Fragment key={s}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:i<=step?"var(--wq-accent)":"var(--wq-chip)", color:i<=step?"#fff":"var(--wq-faint)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{i<step?"✓":i+1}</div>
                <span style={{ fontSize:12, color:i===step?"var(--wq-text)":"var(--wq-faint)", fontWeight:i===step?600:400 }}>{s}</span>
              </div>
              {i<steps.length-1&&<div style={{ flex:1, height:1, background:i<step?"var(--wq-accent)":"var(--wq-border)" }} />}
            </React.Fragment>
          ))}
        </div>
        {step===0&&(
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:18, color:"var(--wq-text)", marginBottom:4 }}>Apply to {job.company}</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)", marginBottom:20 }}>{job.title}</div>
            <div style={{ background:"var(--wq-surface2)", border:"1.5px solid var(--wq-border)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:8 }}>Your Profile</div>
              {profile
                ? [["Name", profile.full_name||"—"], ["Title", profile.title||"—"], ["Experience", profile.experience_years ? profile.experience_years+" yrs" : "—"], ["Resume", profile.resume_url ? "Resume attached ✓" : "No resume uploaded"]].map(([k,vv])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, color:"var(--wq-faint)" }}>{k}</span>
                      <span style={{ fontSize:12, color:"var(--wq-text)", fontWeight:500 }}>{vv}</span>
                    </div>
                  ))
                : [["Name","Alex Johnson"],["Title","Senior Product Designer"],["Experience","6 years"],["Resume","alex_johnson_resume.pdf ✓"]].map(([k,vv])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:12, color:"var(--wq-faint)" }}>{k}</span>
                      <span style={{ fontSize:12, color:"var(--wq-text)", fontWeight:500 }}>{vv}</span>
                    </div>
                  ))
              }
            </div>
            <button onClick={()=>setStep(1)} style={{ width:"100%", background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Looks good → Next</button>
          </div>
        )}
        {step===1&&(
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:18, color:"var(--wq-text)", marginBottom:4 }}>Add a cover note</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)", marginBottom:16 }}>Optional — but it helps.</div>
            <textarea value={coverNote} onChange={e=>setCoverNote(e.target.value)} style={{ width:"100%", height:120, borderRadius:10, border:"1.5px solid var(--wq-border)", padding:"12px 14px", fontSize:13, color:"var(--wq-text)", resize:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", outline:"none", background:"var(--wq-input-bg)" }} placeholder={`Hi ${job.company} team — I'm really excited about this role...`} />
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>setStep(0)} style={{ flex:1, background:"var(--wq-chip)", color:"var(--wq-chip-text)", border:"none", borderRadius:10, padding:"12px", fontSize:14, cursor:"pointer" }}>← Back</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex:2, background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:600, cursor:submitting?"not-allowed":"pointer", opacity:submitting?0.7:1 }}>{submitting ? "Submitting…" : "Submit Application →"}</button>
            </div>
          </div>
        )}
        {step===2&&(
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🎉</div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:20, color:"var(--wq-text)", marginBottom:8 }}>Application Sent!</div>
            <div style={{ fontSize:14, color:"var(--wq-muted)", marginBottom:6 }}>You applied to <strong>{job.title}</strong> at <strong>{job.company}</strong>.</div>
            <div style={{ fontSize:12, color:"#10b981", background:"#d1fae5", borderRadius:8, padding:"8px 14px", marginBottom:20, display:"inline-block" }}>This listing was verified active — they're actively hiring.</div>
            <button onClick={onClose} style={{ background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:10, padding:"12px 32px", fontSize:14, fontWeight:600, cursor:"pointer" }}>Done</button>
          </div>
        )}
        {step<2&&<button onClick={onClose} style={{ position:"absolute", top:20, right:20, background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--wq-faint)" }}>✕</button>}
      </div>
    </div>
  );
}

// ─── JobSeekerView (Browse) ───────────────────────────────────────────────────
function freshnessFilter(job, f) {
  if (f==="Any") return true;
  if (f==="< 24h")   return job.lastVerified < 1;
  if (f==="< 3 days") return job.lastVerified < 3;
  if (f==="< 1 week") return job.lastVerified < 7;
  return true;
}

function JobSeekerView() {
  const [jobs, setJobs] = React.useState(JOBS);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({ type:"Any Type", remote:"Any", experience:"Any Level", industry:"All Industries", freshness:"Any" });
  const [selected, setSelected] = React.useState(null);
  const [applying, setApplying] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [savedIds, toggleSaved] = useSaved();

  React.useEffect(() => {
    if (!window.WQApi || !getSupabase()) return;
    setLoading(true);
    WQApi.fetchActiveJobs()
      .then(data => { setJobs(data.map(normalizeJob)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    if (filters.type!=="Any Type"&&j.type!==filters.type) return false;
    if (filters.remote!=="Any"&&j.remote!==filters.remote) return false;
    if (filters.experience!=="Any Level"&&j.experience!==filters.experience) return false;
    if (filters.industry!=="All Industries"&&j.industry!==filters.industry) return false;
    if (!freshnessFilter(j, filters.freshness)) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !(j.company||'').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const selectedJob = jobs.find(j => j.id === selected);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--wq-bg)" }}>
      <div style={{ background:"var(--wq-surface)", borderBottom:"1px solid var(--wq-border-light)", padding:"14px 28px", display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--wq-faint)", fontSize:16 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs, companies, skills..."
            style={{ width:"100%", padding:"10px 14px 10px 40px", border:"1.5px solid var(--wq-border)", borderRadius:10, fontSize:14, color:"var(--wq-text)", outline:"none", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", background:"var(--wq-input-bg)", transition:"border-color 0.15s" }}
            onFocus={e=>e.target.style.borderColor="var(--wq-accent)"} onBlur={e=>e.target.style.borderColor="var(--wq-border)"} />
        </div>
        <div style={{ fontSize:13, color:"var(--wq-faint)", whiteSpace:"nowrap" }}>
          {loading ? "Loading…" : `${filtered.length} active listing${filtered.length!==1?"s":""}`}
        </div>
      </div>
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ width:240, padding:"18px 16px", overflowY:"auto", flexShrink:0 }}>
          <FilterBar filters={filters} setFilters={setFilters} />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"18px 16px", display:"flex", flexDirection:"column", gap:10, position:"relative" }}>
          {loading
            ? <div style={{ textAlign:"center", marginTop:60, color:"var(--wq-faint)" }}><div style={{ fontSize:24, marginBottom:10 }}>⏳</div><div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, color:"var(--wq-muted)" }}>Loading jobs…</div></div>
            : filtered.length===0
              ? <div style={{ textAlign:"center", marginTop:60, color:"var(--wq-faint)" }}><div style={{ fontSize:32, marginBottom:12 }}>🔎</div><div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, color:"var(--wq-muted)" }}>No active listings match your filters</div></div>
              : filtered.map(job=><JobCard key={job.id} job={job} selected={selected===job.id} onClick={()=>setSelected(selected===job.id?null:job.id)} savedIds={savedIds} onToggleSave={toggleSaved} />)
          }
          {selectedJob&&<JobDetail job={selectedJob} onClose={()=>setSelected(null)} onApply={()=>setApplying(true)} savedIds={savedIds} onToggleSave={toggleSaved} />}
        </div>
      </div>
      {applying&&selectedJob&&<ApplyModal job={selectedJob} onClose={()=>{setApplying(false);setSelected(null);}} />}
    </div>
  );
}

// ─── SavedView ────────────────────────────────────────────────────────────────
function SavedView() {
  const [savedIds, toggleSaved] = useSaved();
  const [applying, setApplying] = React.useState(null);
  const [savedJobs, setSavedJobs] = React.useState(null); // null = not yet loaded

  React.useEffect(() => {
    if (window.WQApi && getSupabase()) {
      WQApi.getSavedJobs()
        .then(jobs => setSavedJobs(jobs.map(normalizeJob)))
        .catch(() => setSavedJobs(JOBS.filter(j => _savedIds.includes(j.id))));
    } else {
      setSavedJobs(JOBS.filter(j => _savedIds.includes(j.id)));
    }
  }, []);

  // Keep in sync when savedIds change (local unsave)
  React.useEffect(() => {
    if (savedJobs !== null && (!window.WQApi || !getSupabase())) {
      setSavedJobs(JOBS.filter(j => savedIds.includes(j.id)));
    }
  }, [savedIds]);

  const displayJobs = savedJobs ?? [];

  return (
    <div style={{ height:"100%", background:"var(--wq-bg)", overflowY:"auto" }}>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 24px" }}>
        <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:20, color:"var(--wq-text)", marginBottom:6 }}>Saved Jobs</div>
        <div style={{ fontSize:13, color:"var(--wq-muted)", marginBottom:24 }}>{savedJobs===null?"Loading…":`${displayJobs.length} job${displayJobs.length!==1?"s":""} bookmarked`}</div>

        {savedJobs === null
          ? <div style={{ textAlign:"center", padding:"60px 0", color:"var(--wq-faint)" }}><div style={{ fontSize:24 }}>⏳</div></div>
          : displayJobs.length === 0
            ? <div style={{ textAlign:"center", padding:"60px 0", color:"var(--wq-faint)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔖</div>
                <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:16, color:"var(--wq-muted)" }}>No saved jobs yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Browse jobs and tap 🔖 to save them here</div>
              </div>
            : displayJobs.map(job => {
                const v = verifiedLabel(job.lastVerified);
                return (
                  <div key={job.id} style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:14, padding:"20px 22px", marginBottom:12, display:"flex", gap:16, alignItems:"center" }}>
                    <div style={{ width:46, height:46, borderRadius:10, background:job.logoColor+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:job.logoColor, flexShrink:0, fontFamily:"Sora,sans-serif" }}>{job.logo}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:15, color:"var(--wq-text)", marginBottom:2 }}>{job.title}</div>
                      <div style={{ fontSize:13, color:"var(--wq-muted)", marginBottom:8 }}>{job.company} · {job.location} · {job.salary}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, background:v.bg, borderRadius:20, padding:"3px 9px" }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:v.dot }} />
                          <span style={{ fontSize:11, fontWeight:600, color:v.color }}>{v.label}</span>
                        </div>
                        <span style={{ fontSize:11, color:"var(--wq-faint)" }}>{job.type} · {job.remote}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                      <button onClick={()=>setApplying(job)} style={{ background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:9, padding:"9px 16px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Apply ⚡</button>
                      <button onClick={()=>{ toggleSaved(job.id); setSavedJobs(prev=>(prev||[]).filter(j=>j.id!==job.id)); }} style={{ background:"var(--wq-chip)", color:"var(--wq-muted)", border:"none", borderRadius:9, padding:"9px 12px", fontSize:13, cursor:"pointer" }} title="Remove">✕</button>
                    </div>
                  </div>
                );
              })
        }
      </div>
      {applying && <ApplyModal job={applying} onClose={()=>setApplying(null)} />}
    </div>
  );
}

// ─── ProfileView ──────────────────────────────────────────────────────────────
const PROFILE_DEMO = {
  name: "Alex Johnson",
  title: "Senior Product Designer",
  location: "San Francisco, CA",
  email: "alex@email.com",
  linkedin: "linkedin.com/in/alexjohnson",
  experience: 6,
  bio: "Product designer with 6 years of experience building 0→1 products and scaling design systems at high-growth startups. Focused on intuitive, accessible interfaces.",
  skills: ["Figma","Design Systems","User Research","Prototyping","Accessibility","Motion Design","React (basic)"],
  preferences: { remote:"Remote or Hybrid", salary:"$140k–$180k", roles:["Product Designer","Lead Designer","Design Manager"], openTo:["Full-time","Contract"] },
  experience_items: [
    { company:"Acme Corp", role:"Senior Product Designer", period:"2022 – Present", desc:"Led design for 3 core product areas. Built and maintained the design system used by 8 engineers." },
    { company:"Figma", role:"Product Designer", period:"2020 – 2022", desc:"Designed features for the Auto Layout and Components systems. Partnered closely with engineering." },
    { company:"Startup Studio", role:"UX Designer", period:"2018 – 2020", desc:"Designed 5 products from 0→1 across fintech, healthcare, and SaaS verticals." },
  ],
};

function ProfileView() {
  const [savedIds] = useSaved();
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (window.WQApi && getSupabase()) {
      WQApi.getSeekerProfile().then(p => { if (p) setProfile(p); }).catch(() => {});
    }
  }, []);

  // Use real profile data if available, otherwise demo data
  const p = profile ? {
    name: profile.full_name || "—",
    title: profile.title || "—",
    location: profile.location || "—",
    email: "", // not stored in seeker_profiles (comes from auth)
    experience: profile.experience_years || 0,
    bio: profile.bio || "",
    skills: profile.skills || [],
    preferences: { remote: profile.remote_pref || "Any", salary: "—", roles: [], openTo: [] },
    experience_items: [],
    resume_url: profile.resume_url,
  } : PROFILE_DEMO;

  async function handleSave() {
    if (!window.WQApi || !getSupabase() || !profile) { setEditing(false); return; }
    setSaving(true);
    try {
      const updated = await WQApi.upsertSeekerProfile(profile);
      setProfile(updated);
    } catch(e) {
      console.error('Save profile failed:', e.message);
    }
    setSaving(false);
    setEditing(false);
  }

  const Section = ({ title, children }) => (
    <div style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:16, padding:"22px 26px", marginBottom:16 }}>
      <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:14, color:"var(--wq-text)", marginBottom:16 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ height:"100%", background:"var(--wq-bg)", overflowY:"auto" }}>
      <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>

        {/* Header card */}
        <div style={{ background:"linear-gradient(135deg, var(--wq-accent-bg), var(--wq-surface))", border:"1.5px solid var(--wq-border)", borderRadius:18, padding:"28px 30px", marginBottom:16, position:"relative" }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
            <div style={{ width:72, height:72, borderRadius:20, background:"linear-gradient(135deg, var(--wq-accent), #8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:26, fontWeight:700, flexShrink:0, fontFamily:"Sora,sans-serif" }}>
              {(p.name||"").substring(0,2).toUpperCase() || "AJ"}
            </div>
            <div style={{ flex:1 }}>
              {editing && profile
                ? <input value={profile.full_name||""} onChange={e=>setProfile(pr=>({...pr,full_name:e.target.value}))}
                    style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize:20, color:"var(--wq-text)", border:"1.5px solid var(--wq-accent)", borderRadius:8, padding:"4px 8px", background:"var(--wq-input-bg)", marginBottom:6, width:"100%", boxSizing:"border-box" }} />
                : <div style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize:22, color:"var(--wq-text)", marginBottom:4 }}>{p.name}</div>
              }
              <div style={{ fontSize:15, color:"var(--wq-muted)", marginBottom:6 }}>{p.title} · {p.location}</div>
              <div style={{ fontSize:13, color:"var(--wq-muted)", lineHeight:1.6, maxWidth:480 }}>{p.bio || "No bio yet."}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:20, flexWrap:"wrap" }}>
            {[["⏳", `${p.experience} yrs exp`], ["🔖", `${savedIds.length} saved jobs`]].map(([icon, val]) => (
              <div key={val} style={{ display:"flex", alignItems:"center", gap:6, background:"var(--wq-surface)", border:"1px solid var(--wq-border)", borderRadius:20, padding:"5px 12px" }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <span style={{ fontSize:12, color:"var(--wq-muted)" }}>{val}</span>
              </div>
            ))}
          </div>
          <button onClick={editing ? handleSave : ()=>{ if(window.WQApi&&getSupabase()&&!profile) WQApi.getSeekerProfile().then(pr=>setProfile(pr||{})).catch(()=>setProfile({})); setEditing(true); }}
            disabled={saving}
            style={{ position:"absolute", top:22, right:22, background:editing?"var(--wq-accent)":"var(--wq-chip)", color:editing?"#fff":"var(--wq-muted)", border:"none", borderRadius:9, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", opacity:saving?0.7:1 }}>
            {saving ? "Saving…" : editing ? "Save changes" : "Edit profile"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Skills */}
          <Section title="Skills">
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {(p.skills||[]).length > 0
                ? p.skills.map(s=>(
                    <span key={s} style={{ fontSize:12, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:7, padding:"5px 11px", fontWeight:500 }}>{s}</span>
                  ))
                : <span style={{ fontSize:13, color:"var(--wq-faint)" }}>No skills added yet.</span>
              }
            </div>
          </Section>

          {/* Job Preferences */}
          <Section title="Job Preferences">
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[["Work style", p.preferences.remote], ["Salary", p.preferences.salary], ["Open to", (p.preferences.openTo||[]).join(", ")||"—"]].map(([k,vv])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--wq-faint)" }}>{k}</span>
                  <span style={{ fontSize:12, color:"var(--wq-text)", fontWeight:600, background:"var(--wq-chip)", borderRadius:6, padding:"3px 9px" }}>{vv||"—"}</span>
                </div>
              ))}
              {(p.preferences.roles||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:12, color:"var(--wq-faint)", marginBottom:6 }}>Target roles</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {p.preferences.roles.map(r=>(
                      <span key={r} style={{ fontSize:11, color:"var(--wq-chip-text)", background:"var(--wq-chip)", borderRadius:6, padding:"4px 9px" }}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Experience */}
        {(p.experience_items||[]).length > 0 && (
          <Section title="Work Experience">
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {p.experience_items.map((item, i)=>(
                <div key={item.company} style={{ display:"flex", gap:16, paddingBottom: i<p.experience_items.length-1?22:0, position:"relative" }}>
                  {i<p.experience_items.length-1&&<div style={{ position:"absolute", left:9, top:20, width:2, bottom:0, background:"var(--wq-border)" }} />}
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"var(--wq-accent-bg)", border:"2px solid var(--wq-accent)", flexShrink:0, marginTop:2 }} />
                  <div>
                    <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-text)" }}>{item.role}</div>
                    <div style={{ fontSize:13, color:"var(--wq-accent)", marginBottom:4 }}>{item.company} <span style={{ color:"var(--wq-faint)", fontWeight:400 }}>· {item.period}</span></div>
                    <div style={{ fontSize:13, color:"var(--wq-muted)", lineHeight:1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Resume */}
        <div style={{ background:"var(--wq-surface)", border:"1.5px dashed var(--wq-border)", borderRadius:14, padding:"20px 24px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:28 }}>📄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-text)" }}>
              {p.resume_url ? "Resume uploaded ✓" : "No resume uploaded"}
            </div>
            <div style={{ fontSize:12, color:"var(--wq-muted)" }}>
              {p.resume_url ? "Attached automatically to applications" : "Upload a PDF to attach it to your applications"}
            </div>
          </div>
          <button style={{ background:"var(--wq-chip)", color:"var(--wq-muted)", border:"none", borderRadius:9, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {p.resume_url ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JobSeekerView, SavedView, ProfileView });
