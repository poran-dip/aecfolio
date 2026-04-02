"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { User, Phone, BookOpen, Link as LinkIcon, ExternalLink, Save, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const COURSES = ["BTECH", "MTECH", "BCA", "MCA"];
const BRANCHES = ["CSE", "ETE", "EE", "IE", "ME", "CE", "IPE", "CHE", "CA"];
const SOCIAL_TYPES = ["LINKEDIN", "GITHUB", "LEETCODE", "CODEFORCES", "OTHER"];

interface ProfileData {
  student: {
    rollNo: string;
    course: string;
    branch: string;
    semester: number;
    bio: string | null;
    phone: string | null;
    socials: { id: string; type: string; url: string }[];
  } | null;
  user: { name: string | null; email: string; image: string | null };
}

const socialIcon = (type: string) => {
  if (type === "GITHUB") return <p>GitHub</p>;
  if (type === "LINKEDIN") return <p>LinkedIn</p>;
  return <ExternalLink size={16} />;
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [semester, setSemester] = useState(1);
  const [socials, setSocials] = useState<{ type: string; url: string }[]>([]);
  const [newSocialType, setNewSocialType] = useState("LINKEDIN");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d: ProfileData) => {
        setData(d);
        setBio(d.student?.bio ?? "");
        setPhone(d.student?.phone ?? "");
        setSemester(d.student?.semester ?? 1);
        setSocials(d.student?.socials.map((s) => ({ type: s.type, url: s.url })) ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, phone, semester }),
      });
      if (res.ok) toast.success("Profile updated!");
      else toast.error("Failed to update profile");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const addSocial = async () => {
    if (!newSocialUrl.trim()) return;
    try {
      const res = await fetch("/api/student/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newSocialType, url: newSocialUrl }),
      });
      if (res.ok) {
        setSocials((prev) => [...prev, { type: newSocialType, url: newSocialUrl }]);
        setNewSocialUrl("");
        toast.success("Social link added!");
      }
    } catch {
      toast.error("Failed to add social link");
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="My Profile"
        subtitle="Personal details and contact information"
        actions={
          <Button onClick={handleSave} loading={saving} icon={<Save size={14} />}>
            Save Changes
          </Button>
        }
      />

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Personal Details */}
        <Card>
          <CardHeader title="Personal Details" icon={<User size={18} />} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name (read-only from Google) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={data?.user.name ?? ""}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Synced from your Google account</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={data?.user.email ?? ""}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            {/* Roll No (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Roll Number</label>
              <input
                type="text"
                value={data?.student?.rollNo ?? "Not assigned"}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Assigned by administrator</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXXXXXXX"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition"
              />
            </div>

            {/* Course (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
              <div className="flex gap-2">
                {COURSES.map((c) => (
                  <span
                    key={c}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      data?.student?.course === c
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Branch (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch</label>
              <input
                type="text"
                value={data?.student?.branch ?? "Not assigned"}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            {/* Current Semester */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition bg-white"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Bio / Objective Statement
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Write a brief professional objective or bio that will appear on your CV..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{bio.length}/500 characters</p>
          </div>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader
            title="Social & Portfolio Links"
            icon={<LinkIcon size={18} />}
            description="These will appear on your CV"
          />

          {/* Existing socials */}
          <div className="space-y-3 mb-6">
            {socials.length === 0 ? (
              <p className="text-sm text-slate-400">No social links added yet.</p>
            ) : (
              socials.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <span className="text-slate-400 shrink-0">{socialIcon(s.type)}</span>
                  <span className="text-xs font-medium text-slate-500 w-24 shrink-0">{s.type}</span>
                  <span className="text-sm text-blue-600 truncate flex-1">{s.url}</span>
                  <button
                    className="text-slate-300 hover:text-red-400 transition-colors"
                    onClick={async () => {
                      await fetch(`/api/student/socials?type=${s.type}`, { method: "DELETE" });
                      setSocials((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new social */}
          <div className="flex items-end gap-3">
            <div className="w-36">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Platform</label>
              <select
                value={newSocialType}
                onChange={(e) => setNewSocialType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none bg-white focus:border-blue-400"
              >
                {SOCIAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">URL</label>
              <input
                type="url"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                onKeyDown={(e) => e.key === "Enter" && addSocial()}
              />
            </div>
            <Button onClick={addSocial} icon={<Plus size={14} />} variant="secondary">
              Add
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
