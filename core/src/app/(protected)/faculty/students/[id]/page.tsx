"use client";

import { ArrowLeft, Check, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FullStudentProfile {
  id: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
  cgpa: number;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  results: {
    id: string;
    semester: number;
    sgpa: number;
    verified: boolean;
    verifiedAt: string;
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    proofImage: string;
    verified: boolean;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    proofImage: string;
    verified: boolean;
  }[];
}

type AchievementOrCert =
  | FullStudentProfile["achievements"][number]
  | FullStudentProfile["certifications"][number];

export default function FacultyStudentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<FullStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    type: "result" | "achievement" | "cert";
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { id } = use(params);

  const loadData = useCallback(() => {
    fetch(`/api/student/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setVerifying(true);

    let url = "";
    if (verifyTarget.type === "result")
      url = `/api/faculty/result/${verifyTarget.id}/verify`;
    else if (verifyTarget.type === "achievement")
      url = `/api/faculty/achievement/${verifyTarget.id}/verify`;
    else url = `/api/faculty/certification/${verifyTarget.id}/verify`;

    try {
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        toast.success("Record verified and locked successfully!");
        loadData();
      } else {
        toast.error("Failed to verify record.");
      }
    } catch {
      toast.error("Network error during verification.");
    } finally {
      setVerifying(false);
      setVerifyTarget(null);
    }
  };

  if (loading || !data) return <Spinner />;

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/faculty">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-slate-800">{data.user.name}</h1>
            <p className="text-sm text-slate-500">
              {data.rollNo} · {data.course} {data.branch} · Sem {data.semester}
            </p>
          </div>
        </div>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Results</CardTitle>
            <CardDescription>Review and lock SGPA records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Reported SGPA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-slate-500 py-8"
                    >
                      No results reported yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.results.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">
                        Semester {res.semester}
                      </TableCell>
                      <TableCell className="text-lg font-bold">
                        {res.sgpa.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {res.verified ? (
                          <Badge variant="default" className="gap-1">
                            <Check size={11} /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Clock size={11} /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {res.verified ? (
                          <span className="text-xs text-slate-400">
                            Locked on{" "}
                            {new Date(res.verifiedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              setVerifyTarget({ id: res.id, type: "result" })
                            }
                          >
                            Verify & Lock
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Achievements & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements & Certifications</CardTitle>
            <CardDescription>Review student credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.achievements.length === 0 &&
            data.certifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No achievements logged.
              </p>
            ) : (
              [...data.achievements, ...data.certifications].map(
                (item: AchievementOrCert) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {"title" in item ? item.title : item.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {"description" in item ? item.description : item.issuer}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.proofImage ? (
                        <a
                          href={item.proofImage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={14} /> View Proof
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">No proof</span>
                      )}
                      {item.verified ? (
                        <Badge variant="default" className="gap-1">
                          <Check size={11} /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock size={11} /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ),
              )
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!verifyTarget}
        onOpenChange={(open) => !open && setVerifyTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Verification</DialogTitle>
            <DialogDescription>
              Are you sure you want to verify and lock this record? Once locked,
              the student will no longer be able to edit or delete it. Please
              ensure you have cross-checked the data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyTarget(null)}
              disabled={verifying}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying ? "Verifying..." : "Yes, Verify & Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
