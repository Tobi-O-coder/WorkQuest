// ApplicantsView.jsx — Company applicant management

const STATUS_CONFIG = {
  pending:     { label:"New",         bg:"#eff6ff", color:"#1d4ed8", dot:"#3b82f6" },
  reviewed:    { label:"Reviewed",    bg:"var(--wq-chip)", color:"var(--wq-muted)", dot:"var(--wq-faint)" },
  shortlisted: { label:"Shortlisted", bg:"#d1fae5", color:"#065f46", dot:"#10b981" },
  rejected:    { label:"Rejected",    bg:"#fee2e2", color:"#991b1b", dot:"#ef4444" },
};

// Demo fallback data
const DEMO_APPLICANTS = [
  { id:"a1", job_id:101, applied_at: new Date(Date.now()-2*864e5).toISOString(), cover_note:"I've been following Notion's design evolution and would love to contribute.", status:"pending",     jobs:{ title:"Senior Product Designer" }, seeker_profiles:{ full_name:"Jordan Lee",    title:"Product Designer",       skills:["Figma","Design Systems","User Research"], resume_url:"#" } },
  { id:"a2", job_id:101, applied_at: new Date(Date.now()-4*864e5).toISOString(), cover_note:"Strong systems thinker with 5 years of B2B SaaS design experience.", status:"shortlisted", jobs:{ title:"Senior Product Designer" }, seeker_profiles:{ full_name:"Sam Rivera",   title:"Senior Designer",        skills:["Figma","Prototyping","Motion Design"],    resume_url:"#" } },
  { id:"a3", job_id:102, applied_at: new Date(Date.now()-1*864e5).toISOString(), cover_note:"TypeScript + React for 4 years. Shipped 3 major features at a similar-stage startup.", status:"pending",     jobs:{ title:"Frontend Engineer"        }, seeker_profiles:{ full_name:"Alex Kim",     title:"Frontend Engineer",      skills:["React","TypeScript","GraphQL"],           resume_url:"#" } },
  { id:"a4", job_id:102, applied_at: new Date(Date.now()-3*864e5).toISOString(), cover_note:"",                                                                                         status:"reviewed",   jobs:{ title:"Frontend Engineer"        }, seeker_profiles:{ full_name:"Casey Morgan",  title:"Full-Stack Developer",   skills:["React","Node.js","PostgreSQL"],           resume_url:null } },
  { id:"a5", job_id:103, applied_at: new Date(Date.now()-5*864e5).toISOString(), cover_note:"Led growth at two Series B companies — happy to share results.",                          status:"pending",     jobs:{ title:"Growth Marketing Manager" }, seeker_profiles:{ full_name:"Taylor Brooks", title:"Growth Manager",         skills:["SEO","Analytics","Paid Acquisition"],     resume_url:"#" } },
];

function formatAppliedDate(dateStr) {
  const hours = (Date.now() - new Date(dateStr)) / 36e5;
  if (hours < 1)  return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const d = Math.floor(hours / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

function StatusPill({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, borderRadius:20, padding:"4px 10px" }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background:c.dot }} />
      <span style={{ fontSize:11, fontWeight:700, color:c.color }}>{c.label}</span>
    </div>
  );
}

function ApplicantDetailPanel({ applicant, onClose, onStatusChange }) {
  const p = applicant.seeker_profiles || {};
  const [status, setStatus] = React.useState(applicant.status);
  const [saving, setSaving] = React.useState(false);

  async function updateStatus(newStatus) {
    setSaving(true);
    setStatus(newStatus);
    try {
      if (window.WQApi && getSupabase()) {
        await WQApi.updateApplicationStatus(applicant.id, newStatus);
      }
      onStatusChange(applicant.id, newStatus);
    } catch(e) {
      console.error('Status update failed:', e.message);
      setStatus(applicant.status); // revert on error
    }
    setSaving(false);
  }

  return (
    <div style={{ position:"absolute", top:0, right:0, width:400, height:"100%", background:"var(--wq-surface)", borderLeft:"1.5px solid var(--wq-border)", display:"flex", flexDirection:"column", zIndex:10, animation:"slideIn 0.2s ease" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}`}</style>

      {/* Header */}
      <div style={{ padding:"22px 24px 18px", borderBottom:"1px solid var(--wq-border-light)" }}>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--wq-faint)", fontSize:20, float:"right", marginTop:-4 }}>✕</button>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg, var(--wq-accent), #8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:18, fontWeight:700, fontFamily:"Sora,sans-serif", flexShrink:0 }}>
            {(p.full_name||"?").split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:17, color:"var(--wq-text)" }}>{p.full_name || "Unknown"}</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)" }}>{p.title || "No title"}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {/* Applied for */}
        <div style={{ background:"var(--wq-surface2)", border:"1.5px solid var(--wq-border-light)", borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:4 }}>Applied for</div>
          <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:13, color:"var(--wq-text)" }}>{applicant.jobs?.title || "Unknown role"}</div>
          <div style={{ fontSize:11, color:"var(--wq-muted)", marginTop:2 }}>{formatAppliedDate(applicant.applied_at)}</div>
        </div>

        {/* Skills */}
        {(p.skills||[]).length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--wq-text)", marginBottom:8 }}>Skills</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {p.skills.map(s => (
                <span key={s} style={{ fontSize:11, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:6, padding:"4px 9px", fontWeight:500 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Cover note */}
        {applicant.cover_note && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--wq-text)", marginBottom:8 }}>Cover Note</div>
            <div style={{ background:"var(--wq-surface2)", border:"1.5px solid var(--wq-border-light)", borderRadius:10, padding:"12px 14px", fontSize:13, color:"var(--wq-muted)", lineHeight:1.6, fontStyle:"italic" }}>
              "{applicant.cover_note}"
            </div>
          </div>
        )}

        {/* Resume */}
        <div style={{ background:"var(--wq-surface2)", border:`1.5px ${p.resume_url?"solid":"dashed"} var(--wq-border)`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ fontSize:22 }}>📄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--wq-text)" }}>{p.resume_url ? "Resume attached" : "No resume"}</div>
            <div style={{ fontSize:11, color:"var(--wq-muted)" }}>{p.resume_url ? "Click to view" : "Applicant hasn't uploaded a resume"}</div>
          </div>
          {p.resume_url && (
            <a href={p.resume_url} target="_blank" rel="noreferrer" style={{ background:"var(--wq-accent)", color:"#fff", borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, textDecoration:"none" }}>View</a>
          )}
        </div>

        {/* Status changer */}
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--wq-text)", marginBottom:8 }}>Update Status</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={()=>updateStatus(key)} disabled={saving}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${status===key?"var(--wq-accent)":"var(--wq-border)"}`, background:status===key?"var(--wq-accent-bg)":"var(--wq-surface)", cursor:"pointer", transition:"all 0.15s", opacity:saving?0.6:1 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:cfg.dot, flexShrink:0 }} />
                <span style={{ fontSize:13, fontWeight:status===key?600:400, color:status===key?"var(--wq-accent)":"var(--wq-muted)" }}>{cfg.label}</span>
                {status===key && <span style={{ marginLeft:"auto", fontSize:12, color:"var(--wq-accent)" }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicantsView() {
  const [applicants, setApplicants] = React.useState(null); // null = loading
  const [selected, setSelected] = React.useState(null);
  const [filterJob, setFilterJob] = React.useState("All");
  const [filterStatus, setFilterStatus] = React.useState("All");

  React.useEffect(() => {
    if (!window.WQApi || !getSupabase()) {
      setApplicants(DEMO_APPLICANTS);
      return;
    }
    WQApi.getAllCompanyApplications()
      .then(setApplicants)
      .catch(() => setApplicants(DEMO_APPLICANTS));
  }, []);

  function handleStatusChange(applicationId, newStatus) {
    setApplicants(prev => prev.map(a => a.id === applicationId ? { ...a, status: newStatus } : a));
    if (selected?.id === applicationId) setSelected(prev => ({ ...prev, status: newStatus }));
  }

  if (applicants === null) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:12, color:"var(--wq-faint)" }}>
        <div style={{ fontSize:24 }}>⏳</div>
        <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-muted)" }}>Loading applicants…</div>
      </div>
    );
  }

  // Unique job titles for filter chips
  const jobTitles = ["All", ...new Set(applicants.map(a => a.jobs?.title).filter(Boolean))];
  const statusKeys = ["All", ...Object.keys(STATUS_CONFIG)];

  const filtered = applicants.filter(a => {
    if (filterJob !== "All" && a.jobs?.title !== filterJob) return false;
    if (filterStatus !== "All" && a.status !== filterStatus) return false;
    return true;
  });

  const counts = {};
  applicants.forEach(a => { counts[a.status] = (counts[a.status]||0)+1; });

  return (
    <div style={{ display:"flex", height:"100%", background:"var(--wq-bg)", overflow:"hidden", position:"relative" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"22px 28px 0", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:20, color:"var(--wq-text)" }}>Applicants</div>
              <div style={{ fontSize:13, color:"var(--wq-muted)" }}>{applicants.length} total across all listings</div>
            </div>
            {/* Summary chips */}
            <div style={{ display:"flex", gap:8 }}>
              {Object.entries(STATUS_CONFIG).map(([key,cfg])=>(
                counts[key] ? (
                  <div key={key} style={{ display:"inline-flex", alignItems:"center", gap:5, background:cfg.bg, borderRadius:20, padding:"5px 12px" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.dot }} />
                    <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{counts[key]} {cfg.label}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.8 }}>Role</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {jobTitles.map(t => (
                  <button key={t} onClick={()=>setFilterJob(t)}
                    style={{ background:filterJob===t?"var(--wq-accent)":"var(--wq-surface)", color:filterJob===t?"#fff":"var(--wq-chip-text)", border:`1.5px solid ${filterJob===t?"var(--wq-accent)":"var(--wq-border)"}`, borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.8 }}>Status</div>
              <div style={{ display:"flex", gap:6 }}>
                {statusKeys.map(s => (
                  <button key={s} onClick={()=>setFilterStatus(s)}
                    style={{ background:filterStatus===s?"var(--wq-accent)":"var(--wq-surface)", color:filterStatus===s?"#fff":"var(--wq-chip-text)", border:`1.5px solid ${filterStatus===s?"var(--wq-accent)":"var(--wq-border)"}`, borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>
                    {s === "All" ? "All" : (STATUS_CONFIG[s]?.label || s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderBottom:"1px solid var(--wq-border-light)" }} />
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 28px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--wq-faint)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>👥</div>
              <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, color:"var(--wq-muted)" }}>No applicants match this filter</div>
            </div>
          )}
          {filtered.map(a => {
            const p = a.seeker_profiles || {};
            const initials = (p.full_name||"?").split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase();
            const isSelected = selected?.id === a.id;
            return (
              <div key={a.id} onClick={()=>setSelected(isSelected ? null : a)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, marginBottom:6, cursor:"pointer", background:isSelected?"var(--wq-accent-bg)":"var(--wq-surface)", border:`1.5px solid ${isSelected?"var(--wq-accent)":"var(--wq-border)"}`, transition:"all 0.15s" }}>
                {/* Avatar */}
                <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg, var(--wq-accent), #8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14, fontWeight:700, flexShrink:0, fontFamily:"Sora,sans-serif" }}>{initials}</div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-text)", marginBottom:2 }}>{p.full_name || "Unknown Applicant"}</div>
                  <div style={{ fontSize:12, color:"var(--wq-muted)", marginBottom:4 }}>{p.title || "No title"} · Applied for <strong>{a.jobs?.title || "Unknown"}</strong></div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {(p.skills||[]).slice(0,3).map(s=>(
                      <span key={s} style={{ fontSize:10, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:5, padding:"2px 7px" }}>{s}</span>
                    ))}
                  </div>
                </div>
                {/* Meta */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <StatusPill status={a.status} />
                  <div style={{ fontSize:11, color:"var(--wq-faint)", marginTop:5 }}>{formatAppliedDate(a.applied_at)}</div>
                  {a.cover_note && <div style={{ fontSize:10, color:"var(--wq-muted)", marginTop:3 }}>Cover note ✓</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ApplicantDetailPanel
          applicant={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

Object.assign(window, { ApplicantsView });
