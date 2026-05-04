"use client";

import {
  Briefcase,
  Building2,
  Calendar,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Button } from "@/components/dashboard/ui/Button";
import { ConfirmModal, Modal } from "@/components/dashboard/ui/Modal";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { formatDate, formatExpType } from "@/lib/utils";

interface Experience {
  id: string;
  type: string;
  title: string;
  organization: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
}

const EXP_TYPES = ["INTERNSHIP", "VOLUNTEER", "CLUB", "OTHER"];
const empty = {
  type: "INTERNSHIP",
  title: "",
  organization: "",
  description: "",
  startDate: "",
  endDate: "",
};

const typeColor: Record<string, "info" | "success" | "warning" | "default"> = {
  INTERNSHIP: "info",
  VOLUNTEER: "success",
  CLUB: "warning",
  OTHER: "default",
};

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    fetch("/api/student/experience")
      .then((r) => r.json())
      .then((d) => setExperiences(d.experiences ?? []))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };
  const openEdit = (e: Experience) => {
    setEditing(e);
    setForm({
      type: e.type,
      title: e.title,
      organization: e.organization,
      description: e.description,
      startDate: e.startDate ? e.startDate.slice(0, 10) : "",
      endDate: e.endDate ? e.endDate.slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.organization) {
      toast.error("Title and organization are required");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/student/experience/${editing.id}`
        : "/api/student/experience";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (editing)
          setExperiences((prev) =>
            prev.map((e) => (e.id === editing.id ? d.experience : e)),
          );
        else setExperiences((prev) => [...prev, d.experience]);
        toast.success(editing ? "Updated!" : "Experience added!");
        setModalOpen(false);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/student/experience/${deleteId}`, { method: "DELETE" });
    setExperiences((prev) => prev.filter((e) => e.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
    toast.success("Deleted");
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Experience"
        subtitle="Internships, volunteer work, club activities"
        actions={
          <Button onClick={openCreate} icon={<Plus size={14} />}>
            Add Experience
          </Button>
        }
      />

      <div className="p-6 max-w-3xl mx-auto">
        {experiences.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-2">
              No experience added
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Add internships, volunteer work, and club activities.
            </p>
            <Button onClick={openCreate} icon={<Plus size={14} />}>
              Add Experience
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Timeline */}
            <div className="relative pl-8">
              <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-slate-200" />
              {experiences.map((exp) => (
                <div key={exp.id} className="relative mb-6 last:mb-0">
                  {/* Dot */}
                  <div className="absolute -left-5 top-4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={typeColor[exp.type] ?? "default"}>
                            {formatExpType(exp.type)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          {exp.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                          <Building2 size={13} />
                          <span>{exp.organization}</span>
                          {(exp.startDate || exp.endDate) && (
                            <>
                              <span className="text-slate-300">·</span>
                              <Calendar size={13} />
                              <span>
                                {formatDate(exp.startDate)} –{" "}
                                {formatDate(exp.endDate)}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          {exp.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Experience" : "Add Experience"}
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">
              Type
            </p>
            <div className="flex gap-2 flex-wrap">
              {EXP_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.type === t ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300"}`}
                >
                  {formatExpType(t)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="experience-role"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Title / Role *
              </label>
              <input
                id="experience-role"
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Frontend Intern"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label
                htmlFor="organization"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Organization *
              </label>
              <input
                id="organization"
                type="text"
                value={form.organization}
                onChange={(e) =>
                  setForm((f) => ({ ...f, organization: e.target.value }))
                }
                placeholder="e.g. Infosys"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Start Date
              </label>
              <input
                id="end-date"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                placeholder="Leave blank if ongoing"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="experience-description"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="experience-description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Describe your responsibilities and achievements..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none transition"
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Experience"
        message="Are you sure? This will be removed from your profile and CV."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
