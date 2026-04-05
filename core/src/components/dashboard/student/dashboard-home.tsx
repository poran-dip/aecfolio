"use client";

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { Card, CardHeader } from "@/components/dashboard/ui/Card";
import { Button } from "@/components/dashboard/ui/Button";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { User, Phone, BookOpen, Link as LinkIcon, ExternalLink, Save, Plus, Trash2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const COURSES = ["BTECH", "MTECH", "BCA", "MCA"];
const BRANCHES = ["CSE", "ETE", "EE", "IE", "ME", "CE", "IPE", "CHE", "CA"];
const SOCIAL_TYPES = ["LINKEDIN", "GITHUB", "LEETCODE", "CODEFORCES", "OTHER"];

interface ProfileData {
  student: {
    id: string;
    rollNo: string;
    course: string;
    branch: string;
    semester: number;
    bio: string | null;
    phone: string | null;
    address: string | null;
    socials: { id: string; type: string; url: string }[];
  } | null;
  name: string | null; 
  email: string; 
  image: string | null;
}

const socialIcon = (type: string) => {
  if (type === "GITHUB") return <ExternalLink size={16} />;
  if (type === "LINKEDIN") return <ExternalLink size={16} />;
  return <ExternalLink size={16} />;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [semester, setSemester] = useState(1);
  const [enrolled, setEnrolled] = useState("ACTIVE");
  const [socials, setSocials] = useState<{ type: string; url: string }[]>([]);
  const [newSocialType, setNewSocialType] = useState("LINKEDIN");
  const [newSocialUrl, setNewSocialUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a temporary local URL for instant preview
    const imageUrl = URL.createObjectURL(file);
    
    // Save to localStorage for cross-component mock sync
    localStorage.setItem("mockUserImage", imageUrl);
    window.dispatchEvent(new Event("userImageUpdated"));
    
    // Optimistically update the UI to show the new image
    setData(prev => {
      if (!prev) {
        return {
          name: "Test Student", email: "student@aec.ac.in", image: imageUrl,
          student: null
        };
      }
      return {
        ...prev,
        image: imageUrl
      };
    });
    
    toast.success("Profile image updated!");

    // Simulate backend upload delay (API missing)
    // Normally: await fetch("/api/upload", { method: "POST", body: formData })
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/me", {
      headers: { "x-user-id": session.user.id },
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("API response:", d);
        setData(d);
        setBio(d.student?.bio ?? "");
        setPhone(d.student?.phone ?? "");
        setAddress(d.student?.address ?? "");
        setSemester(d.student?.semester ?? 1);
        setSocials(d.student?.socials?.map((s: { type: string; url: string }) => ({ type: s.type, url: s.url })) ?? []);
      })
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": session?.user?.id ?? "" },
        body: JSON.stringify({ phone }),
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
    if (socials.some(s => s.type === newSocialType)) {
      toast.error(`You already added a ${newSocialType} link!`);
      return;
    }
    try {
      setSocials((prev) => [...prev, { type: newSocialType, url: newSocialUrl }]);
      setNewSocialUrl("");
      toast.success("Social link added!");
      await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": session?.user?.id ?? "" },
        body: JSON.stringify({ studentId: data?.student?.id, type: newSocialType, url: newSocialUrl }),
      });
    } catch {
      toast.error("Failed to sync social link to server");
    }
  };

  if (status === "loading") return <PageLoader />;

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
        
        {/* Profile Hero Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start p-6 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-r from-blue-600 to-indigo-600"></div>
          <div className="relative mt-8 md:mt-8 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            <div className="relative group shrink-0">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-white">
                {data?.image && <AvatarImage src={data.image} alt={data?.name || "Student"} className="object-cover" />}
                <AvatarFallback className="text-4xl bg-slate-100 text-slate-500 font-medium">
                  {data?.name?.substring(0, 2).toUpperCase() || "ST"}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            
            <div className="flex-1 text-center md:text-left pb-1">
              <h2 className="text-3xl font-bold text-slate-800">{data?.name || "Student Name"}</h2>
              <p className="text-slate-500 font-medium mt-1">{data?.student?.rollNo || "No Roll Assigned"} • {data?.student?.course || "Course"} {data?.student?.branch || ""}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                {enrolled === "ACTIVE" ? (
                  <span className="text-xs px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full tracking-wide uppercase">Active Student</span>
                ) : (
                  <span className="text-xs px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full tracking-wide uppercase">Inactive Student</span>
                )}
                <span className="text-sm font-medium text-slate-500">{data?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <Card>
          <CardHeader title="Account Details" icon={<User size={18} />} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name (read-only from Google) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={data?.name ?? ""}
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
                value={data?.email ?? ""}
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

            {/* Enrollment enrolled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Enrollment enrolled
              </label>
              <select
                value={enrolled}
                onChange={(e) => setEnrolled(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition bg-white"
              >
                <option value="ACTIVE">Currently Enrolled</option>
                <option value="ALUMNI">Passed Out / Graduated</option>
              </select>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Current Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Enter your current residential address..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition resize-none"
              />
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
                      // Update state immediately for functional UI
                      setSocials((prev) => prev.filter((_, idx) => idx !== i));
                      toast.success("Social link removed");
                      
                      // Background sync
                      await fetch(`/api/student/socials?type=${s.type}`, { method: "DELETE" }).catch(() => {});
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
