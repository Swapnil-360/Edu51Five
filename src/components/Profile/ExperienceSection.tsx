import { useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Experience, EmploymentType, EMPLOYMENT_TYPE_LABELS } from "../../types/social";
import { upsertExperience, deleteExperience } from "../../lib/api/profileApi";

interface Props {
  userId: string;
  experiences: Experience[];
  isOwn: boolean;
  isDarkMode: boolean;
  onChanged: () => void;
}

function formatRange(exp: Experience): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const start = fmt(exp.start_date);
  const end = exp.is_current ? "Present" : exp.end_date ? fmt(exp.end_date) : "";
  return end ? `${start} – ${end}` : start;
}

export default function ExperienceSection({ userId, experiences, isOwn, isDarkMode, onChanged }: Props) {
  const [editing, setEditing] = useState<Partial<Experience> | null>(null);

  const card = isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200";
  const title = isDarkMode ? "text-white" : "text-slate-900";
  const sub = isDarkMode ? "text-slate-400" : "text-slate-500";

  if (!isOwn && experiences.length === 0) return null;

  return (
    <section className={`rounded-2xl border p-5 ${card}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-base font-bold flex items-center gap-2 ${title}`}>
          <Briefcase className="w-5 h-5 text-purple-500" /> Experience
        </h3>
        {isOwn && (
          <button
            onClick={() => setEditing({ user_id: userId })}
            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10"
            title="Add experience"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {experiences.length === 0 ? (
        <p className={`text-sm ${sub}`}>No experience added yet.</p>
      ) : (
        <ul className="space-y-4">
          {experiences.map((exp) => (
            <li key={exp.id} className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                <Briefcase className={`w-5 h-5 ${sub}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${title}`}>{exp.title}</p>
                <p className={`text-xs ${sub}`}>
                  {exp.company}
                  {exp.employment_type && ` · ${EMPLOYMENT_TYPE_LABELS[exp.employment_type]}`}
                </p>
                <p className={`text-xs ${sub}`}>{formatRange(exp)}</p>
                {exp.description && (
                  <p className={`text-xs mt-1 whitespace-pre-wrap ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {exp.description}
                  </p>
                )}
              </div>
              {isOwn && (
                <div className="flex gap-1">
                  <button onClick={() => setEditing(exp)} className={`p-1.5 rounded-lg hover:bg-blue-500/10 ${sub}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await deleteExperience(exp.id);
                      onChanged();
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ExperienceFormModal
          initial={editing}
          isDarkMode={isDarkMode}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function ExperienceFormModal({
  initial,
  isDarkMode,
  onClose,
  onSaved,
}: {
  initial: Partial<Experience>;
  isDarkMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [empType, setEmpType] = useState<EmploymentType | "">(initial.employment_type ?? "");
  const [startDate, setStartDate] = useState(initial.start_date ?? "");
  const [endDate, setEndDate] = useState(initial.end_date ?? "");
  const [isCurrent, setIsCurrent] = useState(initial.is_current ?? false);
  const [description, setDescription] = useState(initial.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls = `w-full px-3 py-2 rounded-lg text-sm border outline-none ${
    isDarkMode
      ? "bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
  }`;
  const labelCls = `block text-xs font-medium mb-1 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`;

  const save = async () => {
    if (!title.trim() || !company.trim() || !startDate) {
      setError("Title, company and start date are required.");
      return;
    }
    setSaving(true);
    const { error: err } = await upsertExperience({
      id: initial.id,
      user_id: initial.user_id!,
      title: title.trim(),
      company: company.trim(),
      employment_type: empType || null,
      start_date: startDate,
      end_date: isCurrent ? null : endDate || null,
      is_current: isCurrent,
      description: description.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
          <h3 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {initial.id ? "Edit Experience" : "Add Experience"}
          </h3>
          <button onClick={onClose} className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>}
          <div>
            <label className={labelCls}>Job Title *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend Developer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Company *</label>
              <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Employment Type</label>
              <select className={inputCls} value={empType} onChange={(e) => setEmpType(e.target.value as EmploymentType | "")}>
                <option value="">Select…</option>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} />
            </div>
          </div>
          <label className={`flex items-center gap-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" />
            I currently work here
          </label>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-[80px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
        </div>
        <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDarkMode ? "border-slate-700" : "border-slate-200"}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
