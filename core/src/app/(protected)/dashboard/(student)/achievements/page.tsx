"use client";

import {
  Award,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, VerificationBadge } from "@/components/dashboard/ui/Badge";
import { Button } from "@/components/dashboard/ui/Button";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { ConfirmModal, Modal } from "@/components/dashboard/ui/Modal";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { formatDate } from "@/lib/utils";

interface Achievement {
  id: string;
  type: "achievement" | "certification";
  title: string;
  description: string;
  issuer?: string;
  date: string | null;
  proofImage: string | null;
  verified: boolean;
}

const empty = {
  type: "achievement" as "achievement" | "certification",
  title: "",
  description: "",
  issuer: "",
  date: "",
  proofImage: "",
};

export default function AchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    Promise.all([
      fetch("/api/student/achievements").then((r) => r.json()),
      fetch("/api/student/certifications").then((r) => r.json()),
    ])
      .then(([achData, certData]) => {
        const achs = (achData.achievements || []).map((a: any) => ({
          ...a,
          type: "achievement",
        }));
        const certs = (certData.certifications || []).map((c: any) => ({
          id: c.id,
          type: "certification",
          title: c.name,
          issuer: c.issuer,
          date: c.issueDate,
          proofImage: c.proofImage,
          verified: c.verified,
          description: "",
        }));
        setItems(
          [...achs, ...certs].sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const openCreate = (type: "achievement" | "certification") => {
    setEditing(null);
    setForm({ ...empty, type });
    setModalOpen(true);
  };

  const openEdit = (item: Achievement) => {
    setEditing(item);
    setForm({
      type: item.type,
      title: item.title,
      description: item.description,
      issuer: item.issuer || "",
      date: item.date ? item.date.slice(0, 10) : "",
      proofImage: item.proofImage || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    if (form.type === "certification" && !form.issuer) {
      toast.error("Issuer is required for certifications");
      return;
    }

    setSaving(true);
    try {
      const endpoint =
        form.type === "achievement"
          ? "/api/student/achievements"
          : "/api/student/certifications";
      const url = editing ? `${endpoint}/${editing.id}` : endpoint;

      const payload =
        form.type === "achievement"
          ? {
              title: form.title,
              description: form.description,
              proofImage: form.proofImage || null,
            }
          : {
              name: form.title,
              issuer: form.issuer,
              issueDate: form.date || null,
              proofImage: form.proofImage || null,
            };

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        const newItem =
          form.type === "achievement"
            ? { ...d.achievement, type: "achievement" }
            : {
                id: d.certification.id,
                type: "certification",
                title: d.certification.name,
                issuer: d.certification.issuer,
                date: d.certification.issueDate,
                proofImage: d.certification.proofImage,
                verified: d.certification.verified,
                description: "",
              };

        if (editing) {
          setItems((prev) =>
            prev.map((i) => (i.id === editing.id ? newItem : i)),
          );
        } else {
          setItems((prev) => [newItem, ...prev]);
        }
        toast.success(
          editing ? "Updated successfully!" : "Added successfully!",
        );
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
    const itemToDelete = items.find((i) => i.id === deleteId);
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      const endpoint =
        itemToDelete.type === "achievement"
          ? "/api/student/achievements"
          : "/api/student/certifications";
      await fetch(`${endpoint}/${deleteId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Deleted successfully");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  const achievements = items.filter((i) => i.type === "achievement");
  const certifications = items.filter((i) => i.type === "certification");

  return (
    <div>
      <Navbar
        title="Achievements & Certifications"
        subtitle="Highlight your awards and verified credentials"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Achievements Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" /> Achievements
            </h2>
            <Button
              size="sm"
              onClick={() => openCreate("achievement")}
              icon={<Plus size={14} />}
            >
              Add Achievement
            </Button>
          </div>

          {achievements.length === 0 ? (
            <div className="bg-white border text-center border-slate-200 rounded-xl p-8 shadow-sm">
              <p className="text-slate-500">No achievements added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <VerificationBadge verified={item.verified} />
                    {item.proofImage && (
                      <a
                        href={item.proofImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <ImageIcon size={12} /> View Proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certifications Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Award size={20} className="text-indigo-500" /> Certifications
            </h2>
            <Button
              size="sm"
              onClick={() => openCreate("certification")}
              icon={<Plus size={14} />}
            >
              Add Certification
            </Button>
          </div>

          {certifications.length === 0 ? (
            <div className="bg-white border text-center border-slate-200 rounded-xl p-8 shadow-sm">
              <p className="text-slate-500">No certifications added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <span className="font-medium">{item.issuer}</span>
                        {item.date && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Calendar size={12} /> {formatDate(item.date)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <VerificationBadge verified={item.verified} />
                    {item.proofImage && (
                      <a
                        href={item.proofImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink size={12} /> Certificate Link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editing
            ? `Edit ${form.type === "achievement" ? "Achievement" : "Certification"}`
            : `Add ${form.type === "achievement" ? "Achievement" : "Certification"}`
        }
        maxWidth="md"
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {form.type === "achievement"
                ? "Achievement Title *"
                : "Certification Name *"}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder={
                form.type === "achievement"
                  ? "e.g. 1st Place Hackathon"
                  : "e.g. AWS Certified Developer"
              }
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
            />
          </div>

          {form.type === "certification" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Issuer *
                </label>
                <input
                  type="text"
                  value={form.issuer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issuer: e.target.value }))
                  }
                  placeholder="e.g. Coursera"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
                />
              </div>
            </div>
          )}

          {form.type === "achievement" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Briefly describe the achievement..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Proof Link / Credential URL
            </label>
            <input
              type="url"
              value={form.proofImage}
              onChange={(e) =>
                setForm((f) => ({ ...f, proofImage: e.target.value }))
              }
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
            />
            <p className="text-xs text-slate-400 mt-1">
              Used by faculty to verify this entry.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="Are you sure you want to delete this? It will be removed from your profile and CV."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
