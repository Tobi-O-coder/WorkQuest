// CompanyView.jsx — Dashboard + Verification + Post Job + Email Notification Preview

const COMPANY_JOBS = [
  { id:101, title:"Senior Product Designer", status:"active", posted:"Jan 15, 2026", applicants:42, views:1840, lastVerified:0.3, daysUntilDue:6.7, location:"Remote", type:"Full-time" },
  { id:102, title:"Frontend Engineer", status:"active", posted:"Jan 18, 2026", applicants:18, views:930, lastVerified:1.2, daysUntilDue:5.8, location:"New York, NY", type:"Full-time" },
  { id:103, title:"Growth Marketing Manager", status:"warning", posted:"Dec 20, 2025", applicants:87, views:3240, lastVerified:5.8, daysUntilDue:1.2, location:"Remote", type:"Full-time" },
  { id:104, title:"Data Analyst", status:"expired", posted:"Nov 10, 2025", applicants:54, views:2100, lastVerified:8.1, daysUntilDue:-1.1, location:"San Francisco, CA", type:"Part-time" },
];

function formatPostedCompany(dateStr) {
  if (!dateStr) return 'Recently';
  const hours = (Date.now() - new Date(dateStr)) / 36e5;
  if (hours < 24) return 'Today';
  const d = Math.floor(hours / 24);
  return d === 1 ? 'Yesterday' : new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function StatusBadge({ status, daysUntilDue }) {
  const configs = {
    active:  { label:"Active",                         bg:"#d1fae5", color:"#065f46", dot:"#10b981" },
    warning: { label:`Due in ${(daysUntilDue||0).toFixed(1)}d`, bg:"#fef3c7", color:"#92400e", dot:"#f59e0b" },
    expired: { label:"Unlisted — verify now",          bg:"#fee2e2", color:"#991b1b", dot:"#ef4444" },
  };
  const c = configs[status] || configs.active;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, borderRadius:20, padding:"4px 10px" }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:c.dot }} />
      <span style={{ fontSize:11, fontWeight:700, color:c.color }}>{c.label}</span>
    </div>
  );
}

// ─── Shared bottom-sheet wrapper for modals ───────────────────────────────────
function ModalShell({ children }) {
  const { isMobile } = useViewport();
  return (
    <div style={{ position:"fixed", inset:0, background:"var(--wq-modal-overlay)", display:"flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: isMobile ? "stretch" : "center", zIndex:100, backdropFilter:"blur(6px)", padding: isMobile ? 0 : 20 }}>
      <div style={{ background:"var(--wq-surface)", borderRadius: isMobile ? "20px 20px 0 0" : 20, width: isMobile ? "100%" : "auto", maxHeight: isMobile ? "94vh" : "90vh", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.25)", overflow:"hidden", animation: isMobile ? "slideUpSheet 0.28s ease" : "none" }}>
        {isMobile && (
          <div style={{ display:"flex", justifyContent:"center", paddingTop:10, paddingBottom:2 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:"var(--wq-border)" }} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Email Notification Preview ────────────────────────────────────────────────
function EmailPreviewModal({ onClose }) {
  const { isMobile } = useViewport();
  const [emailType, setEmailType] = React.useState("warning");

  const emailData = {
    warning: { subject:"⚠️ Your listing expires in 1 day — verify now", headline:"Your listing is about to be hidden", subline:"Growth Marketing Manager at Acme Corp", bodyText:"Job seekers are actively browsing WorkQuest right now. To keep your listing visible and marked as 'Actively Recruiting', you need to verify it's still open.", ctaLabel:"Verify My Listing →", ctaColor:"#f59e0b", footerNote:"If you don't verify within 24 hours, your listing will be hidden from job seekers until you do.", statusLabel:"Expires in 1 day", statusBg:"#fef3c7", statusColor:"#92400e", statusDot:"#f59e0b" },
    expired:  { subject:"🚫 Your listing is now hidden from job seekers", headline:"Your listing has been hidden", subline:"Data Analyst at Acme Corp", bodyText:"Because you didn't verify this listing within the 7-day window, it's been automatically hidden from WorkQuest's job board. Don't worry — it hasn't been deleted.", ctaLabel:"Re-verify & Go Live Again →", ctaColor:"#ef4444", footerNote:"Once you verify, your listing will be live again within minutes. Your applicant data is safe.", statusLabel:"Currently hidden", statusBg:"#fee2e2", statusColor:"#991b1b", statusDot:"#ef4444" },
  };
  const d = emailData[emailType];

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: isMobile ? "12px 18px 14px" : "20px 26px 16px", borderBottom:"1.5px solid var(--wq-border-light)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:16, color:"var(--wq-text)" }}>Email Notification Preview</div>
          <div style={{ fontSize:12, color:"var(--wq-muted)" }}>What companies receive when verification is due</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", background:"var(--wq-chip)", borderRadius:9, padding:3, gap:2 }}>
            {[["warning","⚠️ Due"],["expired","🚫 Expired"]].map(([k,label])=>(
              <button key={k} onClick={()=>setEmailType(k)} style={{ background:emailType===k?"var(--wq-surface)":"transparent", border:"none", borderRadius:7, padding:"5px 10px", fontSize:12, fontWeight:emailType===k?600:400, color:emailType===k?"var(--wq-text)":"var(--wq-faint)", cursor:"pointer" }}>{label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--wq-faint)", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
      </div>
      <div style={{ overflowY:"auto", padding:"16px 18px", background:"var(--wq-surface2)", width: isMobile ? "100%" : 600 }}>
        <div style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:14, overflow:"hidden" }}>
          <div style={{ background:"var(--wq-chip)", padding:"10px 16px", display:"flex", gap:8, alignItems:"center", borderBottom:"1px solid var(--wq-border)" }}>
            <div style={{ display:"flex", gap:5 }}>{["#ef4444","#f59e0b","#10b981"].map(c=><div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}</div>
            <div style={{ flex:1, textAlign:"center", fontSize:11, color:"var(--wq-faint)", fontWeight:500 }}>Mail — Inbox</div>
          </div>
          <div style={{ padding:"12px 18px", borderBottom:"1px solid var(--wq-border-light)" }}>
            <div style={{ fontSize:11, color:"var(--wq-faint)", marginBottom:3 }}>Subject</div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--wq-text)" }}>{d.subject}</div>
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <span style={{ fontSize:11, color:"var(--wq-faint)" }}>From: <span style={{ color:"var(--wq-accent)" }}>noreply@workquest.co</span></span>
              <span style={{ fontSize:11, color:"var(--wq-faint)" }}>To: <span style={{ color:"var(--wq-text)" }}>jobs@acmecorp.com</span></span>
            </div>
          </div>
          <div style={{ background:"#f8fafc", padding: isMobile ? "20px 18px" : "28px 36px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:22 }}>
              <div style={{ width:26, height:26, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 12 L8 4 L13 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 9 L10.5 9" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <span style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize:15, color:"#1e1b4b" }}>Work<span style={{ color:"#6366f1" }}>Quest</span></span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:d.statusBg, borderRadius:20, padding:"4px 11px", marginBottom:12 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:d.statusDot }} />
              <span style={{ fontSize:10, fontWeight:700, color:d.statusColor }}>{d.statusLabel}</span>
            </div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:800, fontSize: isMobile ? 18 : 22, color:"#1e1b4b", marginBottom:5, lineHeight:1.2 }}>{d.headline}</div>
            <div style={{ fontSize:13, color:"#6366f1", fontWeight:600, marginBottom:12 }}>{d.subline}</div>
            <p style={{ fontSize:13, color:"#475569", lineHeight:1.7, marginBottom:20 }}>{d.bodyText}</p>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ display:"inline-block", background:d.ctaColor, color:"#fff", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, fontFamily:"Sora,sans-serif", boxShadow:`0 4px 14px ${d.ctaColor}44` }}>{d.ctaLabel}</div>
            </div>
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"11px 14px", marginBottom:18 }}>
              <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, margin:0 }}>{d.footerNote}</p>
            </div>
            <div style={{ textAlign:"center", paddingTop:12, borderTop:"1px solid #e2e8f0" }}>
              <p style={{ fontSize:11, color:"#94a3b8" }}>WorkQuest · Keeping job boards honest since 2026</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--wq-faint)" }}>Emails sent 72h, 24h before expiry, and on auto-hide</div>
      </div>
    </ModalShell>
  );
}

// ─── Verification Modal ───────────────────────────────────────────────────────
function VerificationModal({ job, onClose, onVerify }) {
  const { isMobile } = useViewport();
  const [step, setStep] = React.useState(0);
  const [checked, setChecked] = React.useState({ stillOpen:false, details:false, contact:false });
  const [loading, setLoading] = React.useState(false);
  const allChecked = Object.values(checked).every(Boolean);

  async function handleVerify() {
    if (!allChecked) return;
    setLoading(true);
    await onVerify(job.id);
    setLoading(false);
    setStep(1);
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: isMobile ? "18px 20px 24px" : "36px 40px", width: isMobile ? "100%" : 480, boxSizing:"border-box", position:"relative" }}>
        {!isMobile && <button onClick={onClose} style={{ position:"absolute", top:18, right:18, background:"none", border:"none", cursor:"pointer", color:"var(--wq-faint)", fontSize:18 }}>✕</button>}
        {step===0&&(
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:42, height:42, background:"var(--wq-accent-bg)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>✅</div>
              <div>
                <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:17, color:"var(--wq-text)" }}>Weekly Verification</div>
                <div style={{ fontSize:13, color:"var(--wq-muted)" }}>Confirm your listing is still open</div>
              </div>
            </div>
            <div style={{ background:"var(--wq-surface2)", border:"1.5px solid var(--wq-border)", borderRadius:12, padding:"12px 15px", marginBottom:18 }}>
              <div style={{ fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:3 }}>{job.title}</div>
              <div style={{ fontSize:12, color:"var(--wq-muted)" }}>{job.location} · {job.type}</div>
            </div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:10 }}>Please confirm all of the following:</div>
            <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:22 }}>
              {[["stillOpen","This position is still open and actively accepting applications"],["details","The job details (salary, location, requirements) are still accurate"],["contact","A team member will review new applications this week"]].map(([key,label])=>(
                <label key={key} onClick={()=>setChecked(c=>({...c,[key]:!c[key]}))} style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${checked[key]?"var(--wq-accent)":"var(--wq-border)"}`, background:checked[key]?"var(--wq-accent-bg)":"var(--wq-surface)", transition:"all 0.15s" }}>
                  <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${checked[key]?"var(--wq-accent)":"var(--wq-border)"}`, background:checked[key]?"var(--wq-accent)":"var(--wq-surface)", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                    {checked[key]&&<span style={{ color:"#fff", fontSize:11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:13, color:checked[key]?"var(--wq-text)":"var(--wq-muted)", lineHeight:1.5 }}>{label}</span>
                </label>
              ))}
            </div>
            <button onClick={handleVerify} disabled={!allChecked||loading}
              style={{ width:"100%", background:allChecked?"var(--wq-accent)":"var(--wq-chip)", color:allChecked?"#fff":"var(--wq-faint)", border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:allChecked&&!loading?"pointer":"not-allowed", fontFamily:"Sora,sans-serif", opacity:loading?0.7:1, transition:"all 0.2s" }}>
              {loading ? "Verifying…" : "Verify Listing →"}
            </button>
          </>
        )}
        {step===1&&(
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ width:64, height:64, background:"#d1fae5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}>✓</div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:20, color:"var(--wq-text)", marginBottom:7 }}>Listing Verified!</div>
            <div style={{ fontSize:14, color:"var(--wq-muted)", marginBottom:7 }}><strong>{job.title}</strong> is confirmed as actively recruiting.</div>
            <div style={{ fontSize:13, color:"#10b981", background:"#d1fae5", borderRadius:8, padding:"8px 14px", marginBottom:22, display:"inline-block" }}>Next verification due in 7 days</div>
            <button onClick={onClose} style={{ display:"block", width:"100%", background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"Sora,sans-serif" }}>Done</button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── Post Job Modal ───────────────────────────────────────────────────────────
function PostJobModal({ onClose, onPost }) {
  const { isMobile } = useViewport();
  const [form, setForm] = React.useState({ title:"", location:"", type:"Full-time", salary:"", remote:"Hybrid", experience:"Mid-level" });
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const valid = form.title.trim()&&form.location.trim()&&form.salary.trim();

  async function handlePost() {
    setLoading(true);
    await onPost(form);
    setLoading(false);
    setStep(1);
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: isMobile ? "18px 20px 24px" : "36px 40px", width: isMobile ? "100%" : 500, boxSizing:"border-box", overflowY:"auto", position:"relative" }}>
        {!isMobile && <button onClick={onClose} style={{ position:"absolute", top:18, right:18, background:"none", border:"none", cursor:"pointer", color:"var(--wq-faint)", fontSize:18 }}>✕</button>}
        {step===0&&(
          <>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:19, color:"var(--wq-text)", marginBottom:4 }}>Post a New Job</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)", marginBottom:20 }}>Your listing goes live instantly. Weekly verification keeps it on top.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
              {[["Job Title","title","e.g. Senior Product Designer"],["Location","location","e.g. Remote or San Francisco, CA"],["Salary Range","salary","e.g. $120k–$160k"]].map(([label,key,ph])=>(
                <div key={key}>
                  <label style={{ fontSize:11, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.8, display:"block", marginBottom:5 }}>{label}</label>
                  <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}
                    style={{ width:"100%", padding:"10px 13px", border:"1.5px solid var(--wq-border)", borderRadius:10, fontSize:14, color:"var(--wq-text)", fontFamily:"DM Sans,sans-serif", boxSizing:"border-box", outline:"none", background:"var(--wq-input-bg)" }}
                    onFocus={e=>e.target.style.borderColor="var(--wq-accent)"} onBlur={e=>e.target.style.borderColor="var(--wq-border)"} />
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap:10 }}>
                {[["type",["Full-time","Part-time","Contract"]],["remote",["Remote","Hybrid","On-site"]],["experience",["Entry-level","Mid-level","Senior","Staff"]]].map(([key,opts])=>(
                  <div key={key}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--wq-faint)", textTransform:"uppercase", letterSpacing:0.8, display:"block", marginBottom:5 }}>{key}</label>
                    <select value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ width:"100%", padding:"10px", border:"1.5px solid var(--wq-border)", borderRadius:10, fontSize:13, color:"var(--wq-text)", fontFamily:"DM Sans,sans-serif", outline:"none", background:"var(--wq-input-bg)" }}>
                      {opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:"var(--wq-accent-bg)", borderRadius:10, padding:"11px 13px", marginTop:16, marginBottom:18, fontSize:12, color:"var(--wq-accent-text)", lineHeight:1.5 }}>
              ⚡ <strong>WorkQuest verification:</strong> You'll need to verify this listing once per week. Unverified listings are hidden after 7 days.
            </div>
            <button onClick={()=>valid&&setStep(1)} style={{ width:"100%", background:valid?"var(--wq-accent)":"var(--wq-chip)", color:valid?"#fff":"var(--wq-faint)", border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:valid?"pointer":"not-allowed", fontFamily:"Sora,sans-serif" }}>Preview & Post →</button>
          </>
        )}
        {step===1&&(
          <div style={{ textAlign:"center", padding:"12px 0" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>🚀</div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:20, color:"var(--wq-text)", marginBottom:7 }}>Ready to post!</div>
            <div style={{ fontSize:14, color:"var(--wq-muted)", marginBottom:7 }}><strong>{form.title}</strong> will be live immediately.</div>
            <div style={{ fontSize:12, color:"var(--wq-accent)", background:"var(--wq-accent-bg)", borderRadius:8, padding:"8px 14px", marginBottom:22, display:"inline-block" }}>First verification due in 7 days</div>
            <button onClick={handlePost} disabled={loading} style={{ display:"block", width:"100%", background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"Sora,sans-serif", opacity:loading?0.7:1 }}>
              {loading ? "Posting…" : "Go Live →"}
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ─── CompanyView ──────────────────────────────────────────────────────────────
function CompanyView() {
  const { isMobile } = useViewport();
  const [jobs, setJobs] = React.useState(null);
  const [verifyingJob, setVerifyingJob] = React.useState(null);
  const [postingJob, setPostingJob] = React.useState(false);
  const [showEmailPreview, setShowEmailPreview] = React.useState(false);
  const connected = !!getSupabase();

  React.useEffect(() => {
    if (!connected || !window.WQApi) { setJobs(COMPANY_JOBS); return; }
    WQApi.fetchCompanyJobs()
      .then(setJobs)
      .catch(() => setJobs(COMPANY_JOBS));
  }, []);

  async function handleVerify(id) {
    if (!connected || !window.WQApi) {
      setJobs(prev => prev.map(j => j.id===id ? {...j, status:"active", lastVerified:0, daysUntilDue:7} : j));
      return;
    }
    try {
      const updated = await WQApi.verifyJob(id);
      setJobs(prev => prev.map(j => j.id===id ? {...(prev.find(x=>x.id===id)||{}), ...updated} : j));
    } catch(e) { console.error('Verify failed:', e.message); }
  }

  async function handlePost(form) {
    if (!connected || !window.WQApi) {
      setJobs(prev => [{ id:Date.now(), title:form.title, status:"active", posted:"Today", applicants:0, views:0, lastVerified:0, daysUntilDue:7, location:form.location, type:form.type }, ...prev]);
      return;
    }
    try {
      const remoteMap = { 'Remote':'remote', 'Hybrid':'hybrid', 'On-site':'on-site' };
      const expMap = { 'Entry-level':'Entry', 'Mid-level':'Mid', 'Senior':'Senior', 'Staff':'Lead' };
      await WQApi.postJob({ title:form.title, location:form.location, type:form.type, remote:remoteMap[form.remote]||'hybrid', experience:expMap[form.experience]||'Mid', salary_text:form.salary });
      const updated = await WQApi.fetchCompanyJobs();
      setJobs(updated);
    } catch(e) { console.error('Post job failed:', e.message); }
  }

  if (jobs === null) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:12, color:"var(--wq-faint)" }}>
        <div style={{ fontSize:24 }}>⏳</div>
        <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-muted)" }}>Loading listings…</div>
      </div>
    );
  }

  const needsVerification = jobs.filter(j=>j.status==="warning"||j.status==="expired");
  const totalViews = jobs.reduce((a,j)=>a+(j.views||0),0);
  const totalApplicants = jobs.reduce((a,j)=>a+(j.applicants||0),0);
  const activeCount = jobs.filter(j=>j.status==="active").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--wq-bg)", overflowY:"auto" }}>
      <div style={{ padding: isMobile ? "18px 14px" : "28px 32px", maxWidth:900, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>

        {/* Header */}
        <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent:"space-between", marginBottom:20, gap: isMobile ? 12 : 0 }}>
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize: isMobile ? 19 : 22, color:"var(--wq-text)" }}>Company Dashboard</div>
            <div style={{ fontSize:13, color:"var(--wq-muted)" }}>{connected ? "Live data from your Supabase project" : "Demo mode — connect your backend to go live"}</div>
          </div>
          <div style={{ display:"flex", gap:8, width: isMobile ? "100%" : "auto" }}>
            <button onClick={()=>setShowEmailPreview(true)} style={{ background:"var(--wq-chip)", color:"var(--wq-muted)", border:"none", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500, cursor:"pointer", flex: isMobile ? 1 : "none" }}>📧 Emails</button>
            <button onClick={()=>setPostingJob(true)} style={{ background:"var(--wq-accent)", color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"Sora,sans-serif", flex: isMobile ? 1 : "none" }}>+ Post a Job</button>
          </div>
        </div>

        {/* Stats — 2×2 on mobile, 4×1 on desktop */}
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"Active Listings",   value:activeCount,                 icon:"📋", color:"var(--wq-accent)" },
            { label:"Total Applicants",  value:totalApplicants,             icon:"👥", color:"#10b981" },
            { label:"Total Views",       value:totalViews.toLocaleString(), icon:"👁",  color:"#f59e0b" },
            { label:"Need Verification", value:needsVerification.length,    icon:"⚠️", color:needsVerification.length>0?"#ef4444":"var(--wq-faint)" },
          ].map(stat=>(
            <div key={stat.label} style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{stat.icon}</div>
              <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize: isMobile ? 20 : 22, color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:11, color:"var(--wq-faint)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Verification alert */}
        {needsVerification.length>0&&(
          <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems: isMobile ? "flex-start" : "center", gap:12 }}>
            <div style={{ fontSize:22, flexShrink:0 }}>⏰</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:14, color:"#92400e" }}>{needsVerification.length} listing{needsVerification.length>1?"s":""} need verification</div>
              <div style={{ fontSize:12, color:"#b45309" }}>{needsVerification.find(j=>j.status==="expired")?"One listing is hidden from job seekers.":"Verify soon to keep listings visible."}</div>
            </div>
            <button onClick={()=>setVerifyingJob(needsVerification[0])} style={{ background:"#f59e0b", color:"#fff", border:"none", borderRadius:8, padding:"9px 14px", fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0 }}>Verify →</button>
          </div>
        )}

        {/* Listings */}
        <div style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:16, overflow:"hidden", marginBottom:20 }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--wq-border-light)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:15, color:"var(--wq-text)" }}>Your Listings</div>
            <div style={{ fontSize:12, color:"var(--wq-faint)" }}>{jobs.length} total</div>
          </div>
          {jobs.length===0&&(
            <div style={{ padding:"36px", textAlign:"center", color:"var(--wq-faint)" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
              <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, color:"var(--wq-muted)" }}>No listings yet</div>
              <div style={{ fontSize:12, marginTop:3 }}>Click "Post a Job" to create your first listing.</div>
            </div>
          )}
          {jobs.map((job,i)=>{
            const posted = job.posted || formatPostedCompany(job.posted_at);
            const daysUntilDue = job.daysUntilDue ?? ((new Date(job.expires_at)-Date.now())/864e5);
            return (
              <div key={job.id} style={{ padding: isMobile ? "14px 16px" : "16px 22px", borderBottom:i<jobs.length-1?"1px solid var(--wq-border-light)":"none", opacity:job.status==="expired"?0.75:1 }}>
                {isMobile ? (
                  /* Mobile card layout */
                  <div>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-text)", marginBottom:2 }}>{job.title}</div>
                        <div style={{ fontSize:12, color:"var(--wq-faint)" }}>{job.location} · {job.type}</div>
                      </div>
                      <StatusBadge status={job.status} daysUntilDue={daysUntilDue} />
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:10 }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontWeight:700, fontSize:15, color:"var(--wq-text)" }}>{job.applicants||0}</div>
                        <div style={{ fontSize:10, color:"var(--wq-faint)" }}>Applicants</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontWeight:700, fontSize:15, color:"var(--wq-text)" }}>{(job.views||0).toLocaleString()}</div>
                        <div style={{ fontSize:10, color:"var(--wq-faint)" }}>Views</div>
                      </div>
                      <div style={{ fontSize:11, color:"var(--wq-faint)" }}>Posted {posted}</div>
                    </div>
                    <button onClick={()=>setVerifyingJob(job)} style={{ width:"100%", background:job.status==="expired"?"#fee2e2":job.status==="warning"?"#fef3c7":"var(--wq-chip)", color:job.status==="expired"?"#991b1b":job.status==="warning"?"#92400e":"var(--wq-accent-text)", border:"none", borderRadius:8, padding:"10px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                      {job.status==="expired"?"Re-verify ⚠️":job.status==="warning"?"Verify Soon":"Verify ✓"}
                    </button>
                  </div>
                ) : (
                  /* Desktop row layout */
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:14, color:"var(--wq-text)", marginBottom:3 }}>{job.title}</div>
                      <div style={{ fontSize:12, color:"var(--wq-faint)" }}>{job.location} · {job.type} · Posted {posted}</div>
                    </div>
                    <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                      <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:15, color:"var(--wq-text)" }}>{job.applicants||0}</div><div style={{ fontSize:10, color:"var(--wq-faint)" }}>Applicants</div></div>
                      <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:15, color:"var(--wq-text)" }}>{(job.views||0).toLocaleString()}</div><div style={{ fontSize:10, color:"var(--wq-faint)" }}>Views</div></div>
                    </div>
                    <div style={{ width:160, flexShrink:0, textAlign:"center" }}>
                      <StatusBadge status={job.status} daysUntilDue={daysUntilDue} />
                      <div style={{ fontSize:10, color:"var(--wq-faint)", marginTop:3 }}>
                        {job.status==="active"&&`Next check in ${Math.max(0,daysUntilDue).toFixed(0)}d`}
                        {job.status==="warning"&&"Verify soon!"}
                        {job.status==="expired"&&"Hidden from seekers"}
                      </div>
                    </div>
                    <button onClick={()=>setVerifyingJob(job)} style={{ background:job.status==="expired"?"#fee2e2":job.status==="warning"?"#fef3c7":"var(--wq-chip)", color:job.status==="expired"?"#991b1b":job.status==="warning"?"#92400e":"var(--wq-accent-text)", border:"none", borderRadius:8, padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                      {job.status==="expired"?"Re-verify ⚠️":job.status==="warning"?"Verify Soon":"Verify ✓"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div style={{ background:"var(--wq-surface)", border:"1.5px solid var(--wq-border)", borderRadius:16, padding:"18px 22px" }}>
          <div style={{ fontFamily:"Sora,sans-serif", fontWeight:700, fontSize:14, color:"var(--wq-text)", marginBottom:14 }}>How WorkQuest Verification Works</div>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:12 }}>
            {[
              { icon:"📅", title:"Weekly Check-in",  desc:"Log in and confirm your listing is still open once a week." },
              { icon:"✅", title:"Verified Badge",    desc:"Your listing shows an 'Actively Recruiting' badge to seekers." },
              { icon:"🚫", title:"Auto-Hide",         desc:"Miss the deadline? Your listing is hidden — not deleted — until you verify." },
            ].map(s=>(
              <div key={s.title} style={{ background:"var(--wq-surface2)", borderRadius:10, padding:"13px 15px", display: isMobile ? "flex" : "block", gap: isMobile ? 12 : 0, alignItems: isMobile ? "flex-start" : "unset" }}>
                <div style={{ fontSize: isMobile ? 22 : 22, marginBottom: isMobile ? 0 : 7, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily:"Sora,sans-serif", fontWeight:600, fontSize:13, color:"var(--wq-text)", marginBottom:3 }}>{s.title}</div>
                  <div style={{ fontSize:12, color:"var(--wq-muted)", lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {verifyingJob&&<VerificationModal job={verifyingJob} onClose={()=>setVerifyingJob(null)} onVerify={handleVerify} />}
      {postingJob&&<PostJobModal onClose={()=>setPostingJob(false)} onPost={handlePost} />}
      {showEmailPreview&&<EmailPreviewModal onClose={()=>setShowEmailPreview(false)} />}
    </div>
  );
}

Object.assign(window, { CompanyView });
