"use client";

import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Download, Briefcase } from "lucide-react";

interface QueryResult {
  id: string;
  name: string;
  rollNo: string;
  branch: string;
  cgpa: number;
  skills: string[];
}

export default function AdminQueryPage() {
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [skillFilter, setSkillFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  
  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const q = new URLSearchParams();
      if (minCgpa) q.append("minCgpa", minCgpa);
      if (skillFilter) q.append("skill", skillFilter);
      if (branchFilter) q.append("branch", branchFilter);

      const res = await fetch(`/api/admin/query?${q.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setResults(d.results || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setMinCgpa("");
    setSkillFilter("");
    setBranchFilter("");
    setHasSearched(false);
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Navbar title="Placement Query Builder" subtitle="Filter students by CGPA, branch, and skills for recruitment drives" />

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Query Builder Box */}
        <Card className="bg-white border-blue-100 shadow-md">
           <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <Filter size={18} className="text-blue-500" />
                    <h3 className="font-semibold text-slate-800">Filter Criteria</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Min CGPA</label>
                       <input 
                          type="number" step="0.1" min="0" max="10" 
                          value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)}
                          placeholder="e.g. 7.5"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" 
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Required Skill</label>
                       <input 
                          type="text" 
                          value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}
                          placeholder="e.g. React"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" 
                       />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Branch</label>
                        <select 
                           value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 outline-none"
                        >
                           <option value="">All Branches</option>
                           <option value="CSE">CSE</option>
                           <option value="ETE">ETE</option>
                           <option value="EE">EE</option>
                           <option value="ME">ME</option>
                           <option value="CE">CE</option>
                        </select>
                    </div>
                 </div>
                 <div className="pt-2 flex items-center gap-3">
                    <Button onClick={handleSearch} loading={loading} icon={<Search size={16}/>}>Run Query</Button>
                    <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-800 transition">Clear Filters</button>
                 </div>
              </div>
              
              <div className="w-full md:w-64 bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                 <p className="text-sm font-medium text-slate-700 mb-1">Generated Query Logic:</p>
                 <code className="text-xs text-blue-700 bg-blue-50 px-2 py-1.5 rounded block">
                    SELECT * FROM Students<br/>
                    WHERE CGPA {">="} {minCgpa || "0.0"}<br/>
                    {branchFilter && `AND Branch = '${branchFilter}'\n`}
                    {skillFilter && `AND Skills CONTAINS '${skillFilter}'`}
                 </code>
              </div>
           </div>
        </Card>

        {/* Results */}
        {hasSearched && (
           <Card padding="none" className="overflow-hidden">
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="font-semibold text-slate-800">Results ({results.length} students found)</h3>
                <Button variant="outline" size="sm" icon={<Download size={14} />} disabled={results.length === 0}>
                   Export CSV
                </Button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                     <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Branch</th>
                        <th className="px-6 py-4 text-center">CGPA</th>
                        <th className="px-6 py-4">Matched Skills</th>
                        <th className="px-6 py-4 text-right">Resume</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                     {results.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No students match the criteria.</td></tr>
                     ) : (
                        results.map(r => (
                           <tr key={r.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                 <p className="font-semibold text-slate-900">{r.name}</p>
                                 <p className="text-xs text-slate-500">{r.rollNo}</p>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-700">{r.branch}</td>
                              <td className="px-6 py-4 text-center">
                                 <span className="font-bold text-slate-900">{r.cgpa.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-wrap gap-1">
                                    {r.skills.slice(0,3).map(s => (
                                       <span key={s} className={`px-2 py-0.5 text-[10px] font-medium rounded-sm border ${skillFilter && s.toLowerCase().includes(skillFilter.toLowerCase()) ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{s}</span>
                                    ))}
                                    {r.skills.length > 3 && <span className="text-xs text-slate-400">+{r.skills.length - 3}</span>}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <a href={`/api/cv/${r.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                                    <Briefcase size={12}/> View CV
                                 </a>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
             </div>
           </Card>
        )}

      </div>
    </div>
  );
}
