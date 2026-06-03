// supabase/api.js — All database queries WorkQuest needs
// Loaded as a plain <script> tag; exposes window.WQApi

(function () {

  function db() {
    const client = getSupabase(); // defined in WorkQuest.html
    if (!client) throw new Error('No Supabase connection. Connect your backend first.');
    return client;
  }

  async function currentUser() {
    const { data } = await db().auth.getUser();
    return data.user;
  }

  // Derive status string from job row (mirrors the StatusBadge logic in CompanyView)
  function jobStatus(job) {
    const hoursLeft = (new Date(job.expires_at) - Date.now()) / 36e5;
    if (!job.is_active || hoursLeft <= 0) return 'expired';
    if (hoursLeft <= 48) return 'warning';
    return 'active';
  }

  // ─── JOBS ──────────────────────────────────────────────────────────────────

  async function fetchActiveJobs(filters = {}) {
    let query = db()
      .from('jobs')
      .select('*, companies(name, logo_url, industry, size), applications(count)')
      .eq('is_active', true)
      .order('posted_at', { ascending: false });

    if (filters.remote)     query = query.eq('remote', filters.remote);
    if (filters.type)       query = query.eq('type', filters.type);
    if (filters.experience) query = query.eq('experience', filters.experience);
    if (filters.industry)   query = query.eq('industry', filters.industry);
    if (filters.search)     query = query.ilike('title', `%${filters.search}%`);

    // freshness: only jobs verified within the last N days
    if (filters.freshness) {
      const cutoff = new Date(Date.now() - filters.freshness * 864e5).toISOString();
      query = query.gte('last_verified_at', cutoff);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(j => ({ ...j, status: jobStatus(j) }));
  }

  async function fetchCompanyJobs() {
    const user = await currentUser();
    const { data, error } = await db()
      .from('jobs')
      .select('*')
      .eq('company_id', user.id)
      .order('posted_at', { ascending: false });

    if (error) throw error;

    // Get application counts in one batch query
    const { data: apps } = await db()
      .from('applications')
      .select('job_id')
      .in('job_id', data.map(j => j.id));

    const countByJob = {};
    (apps || []).forEach(a => { countByJob[a.job_id] = (countByJob[a.job_id] || 0) + 1; });

    return data.map(j => ({
      ...j,
      status: jobStatus(j),
      daysUntilDue: (new Date(j.expires_at) - Date.now()) / 864e5,
      applicants: countByJob[j.id] || 0,
    }));
  }

  async function postJob(jobData) {
    const user = await currentUser();
    const { data, error } = await db()
      .from('jobs')
      .insert({ ...jobData, company_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function verifyJob(jobId) {
    const user = await currentUser();
    const now = new Date().toISOString();

    const { data, error } = await db()
      .from('jobs')
      .update({ last_verified_at: now, is_active: true })
      .eq('id', jobId)
      .select()
      .single();
    if (error) throw error;

    // Log the verification event
    await db().from('verifications').insert({ job_id: jobId, verified_by: user.id });

    return { ...data, status: jobStatus(data), daysUntilDue: (new Date(data.expires_at) - Date.now()) / 864e5 };
  }

  async function deleteJob(jobId) {
    const { error } = await db().from('jobs').delete().eq('id', jobId);
    if (error) throw error;
  }

  async function incrementJobViews(jobId) {
    // Fire-and-forget — don't await in the calling code
    await db().rpc('increment_job_views', { job_id: jobId });
  }

  // ─── APPLICATIONS ──────────────────────────────────────────────────────────

  async function applyToJob(jobId, coverNote) {
    const user = await currentUser();
    const { data, error } = await db()
      .from('applications')
      .insert({ job_id: jobId, seeker_id: user.id, cover_note: coverNote })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getSeekerApplications() {
    const { data, error } = await db()
      .from('applications')
      .select('*, jobs(title, companies(name))')
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function getJobApplications(jobId) {
    const { data, error } = await db()
      .from('applications')
      .select('*, seeker_profiles(full_name, title, skills, resume_url)')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function getAllCompanyApplications() {
    const user = await currentUser();
    const { data, error } = await db()
      .from('applications')
      .select('*, seeker_profiles(full_name, title, skills, resume_url), jobs!inner(title, company_id)')
      .eq('jobs.company_id', user.id)
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function updateApplicationStatus(applicationId, status) {
    const { data, error } = await db()
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── SAVED JOBS ────────────────────────────────────────────────────────────

  async function saveJob(jobId) {
    const user = await currentUser();
    const { data, error } = await db()
      .from('saved_jobs')
      .upsert({ job_id: jobId, seeker_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function unsaveJob(jobId) {
    const user = await currentUser();
    const { error } = await db()
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('seeker_id', user.id);
    if (error) throw error;
  }

  async function getSavedJobIds() {
    const user = await currentUser();
    const { data, error } = await db()
      .from('saved_jobs')
      .select('job_id')
      .eq('seeker_id', user.id);
    if (error) throw error;
    return new Set(data.map(r => r.job_id));
  }

  async function getSavedJobs() {
    const { data, error } = await db()
      .from('saved_jobs')
      .select('*, jobs(*, companies(name, logo_url, industry))')
      .order('saved_at', { ascending: false });
    if (error) throw error;
    return data.map(s => ({
      ...s.jobs,
      status: jobStatus(s.jobs),
      savedAt: s.saved_at,
    }));
  }

  // ─── PROFILES ──────────────────────────────────────────────────────────────

  async function getSeekerProfile() {
    const user = await currentUser();
    const { data, error } = await db()
      .from('seeker_profiles')
      .select()
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertSeekerProfile(profile) {
    const user = await currentUser();
    const { data, error } = await db()
      .from('seeker_profiles')
      .upsert({ ...profile, id: user.id, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function getCompanyProfile() {
    const user = await currentUser();
    const { data, error } = await db()
      .from('companies')
      .select()
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function upsertCompanyProfile(profile) {
    const user = await currentUser();
    const { data, error } = await db()
      .from('companies')
      .upsert({ ...profile, id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ─── RESUME STORAGE ────────────────────────────────────────────────────────

  async function uploadResume(file) {
    const user = await currentUser();
    const filePath = `${user.id}/resume.pdf`;

    const { error: uploadError } = await db()
      .storage
      .from('resumes')
      .upload(filePath, file, { upsert: true, contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    // Bucket is public — get a permanent URL
    const { data: { publicUrl } } = db()
      .storage
      .from('resumes')
      .getPublicUrl(filePath);

    // Persist the URL on the seeker profile
    await upsertSeekerProfile({ resume_url: publicUrl });

    return publicUrl;
  }

  async function deleteResume() {
    const user = await currentUser();
    const { error } = await db()
      .storage
      .from('resumes')
      .remove([`${user.id}/resume.pdf`]);
    if (error) throw error;
    await upsertSeekerProfile({ resume_url: null });
  }

  // ─── Expose as global ──────────────────────────────────────────────────────
  window.WQApi = {
    fetchActiveJobs,
    fetchCompanyJobs,
    postJob,
    verifyJob,
    deleteJob,
    incrementJobViews,
    applyToJob,
    getSeekerApplications,
    getJobApplications,
    getAllCompanyApplications,
    updateApplicationStatus,
    saveJob,
    unsaveJob,
    getSavedJobIds,
    getSavedJobs,
    getSeekerProfile,
    upsertSeekerProfile,
    getCompanyProfile,
    upsertCompanyProfile,
    uploadResume,
    deleteResume,
  };

})();
