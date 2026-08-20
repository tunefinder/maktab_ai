"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, Users2, BookOpen, FileText, X, Check, ArrowLeft, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { fastFetch, invalidateFastCache } from "@/utils/fastFetch";
import StudentBulkImportModal from "@/components/StudentBulkImportModal";
import Link from "next/link";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classId: string;
}

interface ClassItem {
  id: string;
  name: string;
  academicYear?: string;
  _count?: { students: number };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Forms
  const [showClassForm, setShowClassForm] = useState(false);
  const [className, setClassName] = useState("");
  const [classYear, setClassYear] = useState(new Date().getFullYear().toString());
  
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Bulk add modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  const fetchClasses = useCallback(async (forceFresh = false) => {
    try {
      const data = await fastFetch<ClassItem[]>("/api/classes", forceFresh);
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(prev => (prev ? (data.find(c => c.id === prev.id) || data[0]) : data[0]));
        }
      }
    } catch {
      toast.error("Sinflarni yuklashda xatolik");
    }
  }, []);

  const fetchStudents = useCallback(async (classId: string, forceFresh = false) => {
    try {
      const data = await fastFetch<Student[]>(`/api/students?classId=${classId}`, forceFresh);
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch {
      toast.error("O'quvchilarni yuklashda xatolik");
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    } else {
      setStudents([]);
    }
  }, [selectedClass, fetchStudents]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return toast.error("Sinf nomi kiritilishi shart");
    
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className, academicYear: classYear })
      });
      if (res.ok) {
        const newCls = await res.json();
        toast.success("Sinf muvaffaqiyatli yaratildi");
        setClassName("");
        setShowClassForm(false);
        invalidateFastCache("/api/classes");
        invalidateFastCache("/api/stats");
        fetchClasses(true);
        if (newCls?.id) setSelectedClass(newCls);
      } else {
        toast.error("Xatolik yuz berdi");
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Sinf va uning barcha o'quvchilari o'chib ketadi. Rozimisiz?")) return;
    
    // Optimistic delete
    setClasses(prev => prev.filter(c => c.id !== id));
    if (selectedClass?.id === id) {
      const remaining = classes.filter(c => c.id !== id);
      setSelectedClass(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sinf o'chirildi");
        invalidateFastCache("/api/classes");
        invalidateFastCache("/api/stats");
      } else {
        fetchClasses(true);
      }
    } catch {
      toast.error("Xatolik yuz berdi");
      fetchClasses(true);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!studentFirstName.trim() || !studentLastName.trim()) return toast.error("Ism va familiya kiriting");
    if (isSubmittingStudent) return;
    
    const fName = studentFirstName.trim();
    const lName = studentLastName.trim();
    setIsSubmittingStudent(true);

    // Optimistic addition
    const tempId = `temp-${Date.now()}`;
    setStudents(prev => [...prev, { id: tempId, firstName: fName, lastName: lName, classId: selectedClass.id }]);
    setStudentFirstName("");
    setStudentLastName("");
    setShowStudentForm(false);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName: fName, 
          lastName: lName,
          classId: selectedClass.id
        })
      });
      if (res.ok) {
        toast.success("O'quvchi muvaffaqiyatli qo'shildi");
        invalidateFastCache(`/api/students?classId=${selectedClass.id}`);
        invalidateFastCache("/api/stats");
        fetchStudents(selectedClass.id, true);
        fetchClasses(true);
      } else {
        toast.error("Xatolik yuz berdi");
        fetchStudents(selectedClass.id, true);
      }
    } catch {
      toast.error("Xatolik yuz berdi");
      fetchStudents(selectedClass.id, true);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!selectedClass) return;
    if (!confirm("O'quvchini o'chirasizmi?")) return;
    
    // Optimistic deletion
    setStudents(prev => prev.filter(s => s.id !== id));

    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("O'quvchi o'chirildi");
        invalidateFastCache(`/api/students?classId=${selectedClass.id}`);
        invalidateFastCache("/api/stats");
        fetchClasses(true);
      } else {
        fetchStudents(selectedClass.id, true);
      }
    } catch {
      toast.error("Xatolik yuz berdi");
      fetchStudents(selectedClass.id, true);
    }
  };

  const handleOpenStudentDetails = async (studentId: string) => {
    try {
      const data = await fastFetch(`/api/students/${studentId}`);
      setSelectedStudentForDetails(data);
    } catch {
      toast.error("O'quvchi ma'lumotlarini yuklab bo'lmadi");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/" prefetch={true} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors md:hidden">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-xs shrink-0">
          <Users2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Sinflar va O&apos;quvchilar</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Barcha sinflar va o&apos;quvchilar ro&apos;yxati</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left: Classes Selector Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              Sinflar ({classes.length})
            </h2>
            <Button 
              onClick={() => setShowClassForm(!showClassForm)}
              className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Sinf qo&apos;shish
            </Button>
          </div>

          {/* New Class Form Card */}
          {showClassForm && (
            <Card className="p-4 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <form onSubmit={handleCreateClass} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sinf nomi (Masalan: 9-A)</label>
                  <input 
                    type="text" 
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    placeholder="9-A"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">O&apos;quv yili</label>
                  <input 
                    type="text" 
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                    placeholder="2026-2027"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowClassForm(false)}>Bekor qilish</Button>
                  <Button type="submit" className="h-8 text-xs bg-indigo-600 text-white">Saqlash</Button>
                </div>
              </form>
            </Card>
          )}

          {classes.length === 0 ? (
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Hali sinflar yo&apos;q</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 max-h-[450px] overflow-y-auto custom-scrollbar">
              {classes.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedClass(c)}
                  className={`p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between group ${
                    selectedClass?.id === c.id 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-xs" 
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{c.name}</h3>
                    <p className={`text-[11px] mt-0.5 ${selectedClass?.id === c.id ? "text-indigo-100" : "text-slate-400"}`}>
                      {c._count?.students || 0} o&apos;quvchi
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClass(c.id, e)}
                    className={`p-1.5 rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ${
                      selectedClass?.id === c.id ? "hover:bg-indigo-700 text-indigo-100" : "hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
                    }`}
                    title="Sinfni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Students List & Actions Panel */}
        <div>
          {!selectedClass ? (
            <Card className="h-full flex items-center justify-center p-8 bg-white dark:bg-slate-800 border-dashed min-h-[300px]">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Sinf tanlanmagan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">O&apos;quvchilarni ko&apos;rish uchun yuqoridan sinfni tanlang</p>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              {/* Class Header Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedClass.name} O&apos;quvchilari
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jami {students.length} ta o&apos;quvchi (Tarixini ko&apos;rish uchun ustiga bosing)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setShowBulkModal(true)}
                    variant="outline"
                    className="h-8 sm:h-9 text-xs px-2.5 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                    leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                  >
                    Word / Excel / Matn yuklash
                  </Button>
                  <Button 
                    onClick={() => setShowStudentForm(!showStudentForm)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 sm:h-9 text-xs px-2.5 shadow-xs"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    O&apos;quvchi qo&apos;shish
                  </Button>
                </div>
              </div>

              {/* Single Student Add Form */}
              {showStudentForm && (
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/20">
                  <form onSubmit={handleAddStudent} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ism</label>
                        <input 
                          type="text" 
                          value={studentFirstName}
                          onChange={(e) => setStudentFirstName(e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100"
                          placeholder="Ali"
                          autoFocus
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Familiya</label>
                        <input 
                          type="text" 
                          value={studentLastName}
                          onChange={(e) => setStudentLastName(e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100"
                          placeholder="Valiyev"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowStudentForm(false)}>Bekor qilish</Button>
                      <Button type="submit" className="h-8 text-xs bg-emerald-600 text-white" loading={isSubmittingStudent}>Qo&apos;shish</Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Students Grid List */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto max-h-[550px] custom-scrollbar">
                {students.length === 0 ? (
                  <div className="text-center p-10 space-y-3">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Bu sinfda hali o&apos;quvchilar yo&apos;q</p>
                      <p className="text-xs text-slate-400 mt-1">Word, CSV yoki Telegramdan nusxalab butun sinfni 1 soniyada qo&apos;shishingiz mumkin</p>
                    </div>
                    <Button
                      onClick={() => setShowBulkModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shadow-sm"
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                    >
                      O&apos;quvchilarni tezkor yuklash
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {students.map((student, idx) => (
                      <div 
                        key={student.id} 
                        onClick={() => handleOpenStudentDetails(student.id)}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 group-hover:text-indigo-600 transition-colors">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {student.firstName} {student.lastName}
                            </p>
                            <span className="text-[10px] text-slate-400">Rivojlanish tarixi</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                          title="O'quvchini o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Smart Student Bulk Import Modal */}
      {selectedClass && (
        <StudentBulkImportModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          classId={selectedClass.id}
          className={selectedClass.name}
          onSuccess={() => {
            invalidateFastCache(`/api/students?classId=${selectedClass.id}`);
            invalidateFastCache("/api/stats");
            fetchStudents(selectedClass.id, true);
            fetchClasses(true);
          }}
        />
      )}

      {/* Student Growth History Modal */}
      {selectedStudentForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {selectedStudentForDetails.firstName} {selectedStudentForDetails.lastName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {selectedStudentForDetails.class?.name} • Rivojlanish va Topshiriqlar Tarixi
                </p>
              </div>
              <button 
                onClick={() => setSelectedStudentForDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Jami ishlar</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedStudentForDetails.attempts?.length || 0} ta
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-center">
                  <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase">O&apos;rtacha</span>
                  <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {selectedStudentForDetails.attempts?.length > 0 
                      ? Math.round(selectedStudentForDetails.attempts.reduce((a: number, c: any) => a + (c.percentage || 0), 0) / selectedStudentForDetails.attempts.length) 
                      : 0}%
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900 text-center">
                  <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase">So&apos;nggi</span>
                  <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {selectedStudentForDetails.attempts?.[0]?.percentage ?? 0}%
                  </p>
                </div>
              </div>

              {/* Growth Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Topshiriqlar Bo&apos;yicha Natijalar
                </h4>
                {selectedStudentForDetails.attempts?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Bu o&apos;quvchi hali birorta ham test yoki diktant topshirmagan.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStudentForDetails.attempts?.map((att: any, aIdx: number) => (
                      <div key={aIdx} className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{att.test?.title || "Topshiriq"}</h5>
                            <span className="text-[10px] text-slate-400">{att.test?.subject} • {new Date(att.createdAt).toLocaleDateString('uz-UZ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{att.score} ball</span>
                            <span className="text-[10px] text-slate-400 block font-semibold">{att.percentage}%</span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              att.percentage >= 80 ? 'bg-emerald-500' :
                              att.percentage >= 60 ? 'bg-indigo-500' :
                              att.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, att.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
