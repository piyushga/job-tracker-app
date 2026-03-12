import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const STATUS_CONFIG = {
  Applied:   { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",   dot: "#60a5fa" },
  Interview: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   dot: "#f59e0b" },
  Offer:     { color: "#10b981", bg: "rgba(16,185,129,0.12)",   dot: "#10b981" },
  Rejected:  { color: "#f87171", bg: "rgba(248,113,113,0.12)",  dot: "#f87171" },
  Ghosted:   { color: "#9ca3af", bg: "rgba(156,163,175,0.12)",  dot: "#9ca3af" },
};

const defaultForm = {
  company: "",
  role: "",
  job_link: "",
  resume_used: "",
  status: "Applied",
  applied_date: new Date().toISOString().split("T")[0],
  notes: "",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#0f1117", border: "1px solid #1e2333",
        borderRadius: 16, padding: 32, width: "100%", maxWidth: 560,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.color}30`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      letterSpacing: "0.05em", textTransform: "uppercase",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      <input {...props} style={{
        width: "100%", background: "#151820", border: "1px solid #1e2333",
        borderRadius: 8, padding: "10px 12px", color: "#e5e7eb", fontSize: 14,
        outline: "none", boxSizing: "border-box", transition: "border 0.2s", fontFamily: "inherit",
        ...props.style,
      }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e)  => (e.target.style.borderColor = "#1e2333")}
      />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      <textarea {...props} rows={3} style={{
        width: "100%", background: "#151820", border: "1px solid #1e2333",
        borderRadius: 8, padding: "10px 12px", color: "#e5e7eb", fontSize: 14,
        outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit",
        ...props.style,
      }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e)  => (e.target.style.borderColor = "#1e2333")}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      <select {...props} style={{
        width: "100%", background: "#151820", border: "1px solid #1e2333",
        borderRadius: 8, padding: "10px 12px", color: "#e5e7eb", fontSize: 14,
        outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer",
      }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 20px", flexDirection: "column", gap: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #1e2333", borderTopColor: "#6366f1",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: "#4b5563", fontSize: 14 }}>Loading your applications…</div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div style={{
      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
      borderRadius: 10, padding: "12px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <span style={{ color: "#f87171", fontSize: 13 }}>⚠️ {message}</span>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 }}>×</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [saving, setSaving]       = useState(false);

  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(defaultForm);
  const [editId, setEditId]       = useState(null);

  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewApp, setViewApp]     = useState(null);
  const [deleteId, setDeleteId]   = useState(null);

  // ── Fetch all applications on mount ──
  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load applications: " + error.message);
    } else {
      setApps(data || []);
    }
    setLoading(false);
  }

  // ── Create ──
  async function handleSubmit() {
    if (!form.company || !form.role) return;
    setSaving(true);
    setError(null);

    if (editId) {
      // Update existing
      const { error } = await supabase
        .from("job_applications")
        .update({
          company:      form.company,
          role:         form.role,
          job_link:     form.job_link,
          resume_used:  form.resume_used,
          status:       form.status,
          applied_date: form.applied_date,
          notes:        form.notes,
        })
        .eq("id", editId);

      if (error) {
        setError("Failed to update: " + error.message);
      } else {
        setApps((prev) =>
          prev.map((a) => (a.id === editId ? { ...a, ...form } : a))
        );
        closeForm();
      }
    } else {
      // Insert new (use timestamp string as id)
      const newRecord = { ...form, id: Date.now().toString() };
      const { data, error } = await supabase
        .from("job_applications")
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        setError("Failed to add application: " + error.message);
      } else {
        setApps((prev) => [data, ...prev]);
        closeForm();
      }
    }
    setSaving(false);
  }

  // ── Delete ──
  async function handleDelete(id) {
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id);

    if (error) {
      setError("Failed to delete: " + error.message);
    } else {
      setApps((prev) => prev.filter((a) => a.id !== id));
      setDeleteId(null);
      setViewApp(null);
    }
  }

  function handleEdit(app) {
    setForm({
      company:      app.company,
      role:         app.role,
      job_link:     app.job_link || "",
      resume_used:  app.resume_used || "",
      status:       app.status,
      applied_date: app.applied_date || new Date().toISOString().split("T")[0],
      notes:        app.notes || "",
    });
    setEditId(app.id);
    setViewApp(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(defaultForm);
    setEditId(null);
  }

  // ── Derived state ──
  const filtered = apps.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      (a.resume_used || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     apps.length,
    interview: apps.filter((a) => a.status === "Interview").length,
    offer:     apps.filter((a) => a.status === "Offer").length,
    active:    apps.filter((a) => !["Rejected", "Ghosted"].includes(a.status)).length,
  };

  // ── Render ──
  return (
    <div style={{ minHeight: "100vh", background: "#080b12", color: "#e5e7eb", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #0f1420", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg,#a5b4fc,#e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>JobTrackr</span>
          </div>
          <div style={{ fontSize: 12, color: "#4b5563" }}>Never lose track of your applications</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Live sync indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px #10b981" }} />
            Synced to cloud
          </div>
          <button
            onClick={() => { setForm(defaultForm); setEditId(null); setShowForm(true); }}
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
              borderRadius: 10, padding: "10px 20px", color: "#fff", fontWeight: 600,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Application
          </button>
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>

        {/* Error Banner */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Applied", val: stats.total,     color: "#6366f1" },
            { label: "Active",        val: stats.active,    color: "#60a5fa" },
            { label: "Interviews",    val: stats.interview, color: "#f59e0b" },
            { label: "Offers",        val: stats.offer,     color: "#10b981" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#0c1018", border: "1px solid #1a1f2e", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "Syne, sans-serif" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            placeholder="🔍  Search company, role, resume..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, background: "#0c1018", border: "1px solid #1a1f2e",
              borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: 14,
              outline: "none", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", ...Object.keys(STATUS_CONFIG)].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                background: filterStatus === s ? "#1e2333" : "transparent",
                border: `1px solid ${filterStatus === s ? "#6366f1" : "#1a1f2e"}`,
                borderRadius: 8, padding: "8px 14px",
                color: filterStatus === s ? "#a5b4fc" : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#374151" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{apps.length === 0 ? "No applications yet" : "No matches found"}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{apps.length === 0 ? "Add your first job application to get started" : "Try adjusting your search or filters"}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => setViewApp(app)}
                style={{
                  background: "#0c1018", border: "1px solid #1a1f2e", borderRadius: 12,
                  padding: "16px 20px", cursor: "pointer", transition: "all 0.15s",
                  display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2d3348"; e.currentTarget.style.background = "#0e1420"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1f2e"; e.currentTarget.style.background = "#0c1018"; }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 16px", alignItems: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `hsl(${(app.company.charCodeAt(0) * 17) % 360},40%,20%)`,
                    border: `1px solid hsl(${(app.company.charCodeAt(0) * 17) % 360},50%,30%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700,
                    color: `hsl(${(app.company.charCodeAt(0) * 17) % 360},70%,70%)`,
                  }}>
                    {app.company[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{app.company}</span>
                      <span style={{ color: "#6b7280", fontSize: 13 }}>·</span>
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>{app.role}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>📄 {app.resume_used || "—"}</span>
                      <span>📅 {app.applied_date || "—"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tag status={app.status} />
                  {app.job_link && (
                    <a
                      href={app.job_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "#6366f1", fontSize: 18, textDecoration: "none" }}
                      title="Open job link"
                    >🔗</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showForm} onClose={closeForm}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#e5e7eb" }}>
          {editId ? "✏️ Edit Application" : "➕ New Application"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Company *" placeholder="e.g. Google"            value={form.company}      onChange={(e) => setForm((p) => ({ ...p, company:      e.target.value }))} />
          <Input label="Role *"    placeholder="e.g. Software Engineer" value={form.role}         onChange={(e) => setForm((p) => ({ ...p, role:         e.target.value }))} />
        </div>
        <Input label="Job Link"     placeholder="https://..."              value={form.job_link}     onChange={(e) => setForm((p) => ({ ...p, job_link:     e.target.value }))} />
        <Input label="Resume Used"  placeholder="e.g. resume_swe_v3.pdf"  value={form.resume_used}  onChange={(e) => setForm((p) => ({ ...p, resume_used:  e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Select label="Status" options={Object.keys(STATUS_CONFIG)} value={form.status}        onChange={(e) => setForm((p) => ({ ...p, status:       e.target.value }))} />
          <Input  label="Applied Date" type="date"                       value={form.applied_date} onChange={(e) => setForm((p) => ({ ...p, applied_date: e.target.value }))} />
        </div>
        <Textarea label="Notes" placeholder="Interview rounds, contacts, salary range..." value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={!form.company || !form.role || saving}
            style={{
              flex: 1, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none",
              borderRadius: 10, padding: "12px", color: "#fff", fontWeight: 600, fontSize: 15,
              cursor: form.company && form.role && !saving ? "pointer" : "not-allowed",
              opacity: form.company && form.role && !saving ? 1 : 0.5, fontFamily: "inherit",
            }}
          >
            {saving ? "Saving…" : editId ? "Save Changes" : "Add Application"}
          </button>
          <button onClick={closeForm} style={{
            background: "#151820", border: "1px solid #1e2333", borderRadius: 10, padding: "12px 20px",
            color: "#9ca3af", cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewApp} onClose={() => setViewApp(null)}>
        {viewApp && (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: `hsl(${(viewApp.company.charCodeAt(0) * 17) % 360},40%,20%)`,
                  border: `1px solid hsl(${(viewApp.company.charCodeAt(0) * 17) % 360},50%,30%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700,
                  color: `hsl(${(viewApp.company.charCodeAt(0) * 17) % 360},70%,70%)`,
                }}>{viewApp.company[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800 }}>{viewApp.company}</div>
                  <div style={{ color: "#9ca3af", fontSize: 14 }}>{viewApp.role}</div>
                </div>
              </div>
              <Tag status={viewApp.status} />
            </div>

            {[
              { icon: "📄", label: "Resume Used", val: viewApp.resume_used || "—" },
              { icon: "📅", label: "Applied On",  val: viewApp.applied_date || "—" },
              { icon: "🔗", label: "Job Link",    val: viewApp.job_link, link: true },
            ].map((row) => (
              <div key={row.label} style={{ background: "#151820", border: "1px solid #1a1f2e", borderRadius: 10, padding: "12px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{row.label}</div>
                  {row.link && row.val ? (
                    <a href={row.val} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", fontSize: 14, wordBreak: "break-all" }}>{row.val}</a>
                  ) : (
                    <div style={{ fontSize: 14, color: "#e5e7eb", wordBreak: "break-all" }}>{row.val}</div>
                  )}
                </div>
              </div>
            ))}

            {viewApp.notes && (
              <div style={{ background: "#151820", border: "1px solid #1a1f2e", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>📝 Notes</div>
                <div style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{viewApp.notes}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => handleEdit(viewApp)} style={{
                flex: 1, background: "#1e2333", border: "1px solid #2d3348", borderRadius: 10,
                padding: "11px", color: "#a5b4fc", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>✏️ Edit</button>
              <button onClick={() => setDeleteId(viewApp.id)} style={{
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10,
                padding: "11px 18px", color: "#f87171", cursor: "pointer", fontFamily: "inherit",
              }}>🗑️</button>
            </div>
          </>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗑️</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Delete Application?</div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>This cannot be undone.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleDelete(deleteId)} style={{
              flex: 1, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: 10, padding: "12px", color: "#f87171", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>Yes, Delete</button>
            <button onClick={() => setDeleteId(null)} style={{
              flex: 1, background: "#151820", border: "1px solid #1e2333",
              borderRadius: 10, padding: "12px", color: "#9ca3af", cursor: "pointer", fontFamily: "inherit",
            }}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
