"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExamForm from "@/src/components/exam/ExamForm";
import { Exam } from "@/src/types/exam";
import examService from "@/src/services/exam.service";

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await examService.getAllExams();
      setExams(data);
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
      alert(error.message || 'Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch exams on mount
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateExam = async (examData: Omit<Exam, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsSubmitting(true);
      const newExam = await examService.createExam({
        name: examData.name,
        description: examData.description,
        countries: examData.countries,
        subject_ids: examData.subject_ids,
        metadata: examData.metadata,
      });
      setExams([...exams, newExam]);
      setIsCreateDialogOpen(false);
      alert('Exam created successfully');
    } catch (error: any) {
      console.error('Failed to create exam:', error);
      alert(error.message || 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExam = async (examData: Omit<Exam, "id" | "createdAt" | "updatedAt">) => {
    if (!editingExam) return;
    
    try {
      setIsSubmitting(true);
      const updatedExam = await examService.updateExam(editingExam.id, {
        name: examData.name,
        description: examData.description,
        countries: examData.countries,
        subject_ids: examData.subject_ids,
        metadata: examData.metadata,
      });
      setExams(exams.map(exam => exam.id === editingExam.id ? updatedExam : exam));
      setEditingExam(null);
      alert('Exam updated successfully');
    } catch (error: any) {
      console.error('Failed to update exam:', error);
      alert(error.message || 'Failed to update exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? It will be archived.")) return;
    
    try {
      await examService.deleteExam(examId);
      fetchExams(); // Refresh list
      alert('Exam archived successfully');
    } catch (error: any) {
      console.error('Failed to delete exam:', error);
      alert(error.message || 'Failed to delete exam');
    }
  };

  const handleToggleStatus = async (examId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    if (!confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      await examService.updateExamStatus(examId, newStatus as any);
      fetchExams(); // Refresh list
      alert(`Status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      <PageHeader title="Exam Management" />
      <PageWrapper>
        <div className="flex justify-between items-center mb-6">
          <PageTitle backButton={{ enabled: false }}>Exam Onboarding</PageTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add New Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <ExamForm onSubmit={handleCreateExam} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-2 text-gray-600">Loading exams...</span>
          </div>
        )}

        {/* Exams Table */}
        {!isLoading && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{exam.description}</TableCell>
                  <TableCell>{exam.countries.join(", ")}</TableCell>
                  <TableCell>
                    {exam.subjects && exam.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {exam.subjects.slice(0, 2).map((subject) => (
                          <span
                            key={subject.id}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {subject.code}
                          </span>
                        ))}
                        {exam.subjects.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{exam.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No subjects</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(exam.id, exam.status)}
                      className={`text-xs ${
                        exam.status === 'PUBLISHED' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {exam.status}
                    </Button>
                  </TableCell>
                  <TableCell>{formatDate(exam.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={editingExam?.id === exam.id} onOpenChange={(open) => !open && setEditingExam(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExam(exam)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Exam</DialogTitle>
                          </DialogHeader>
                          <ExamForm 
                            initialData={editingExam || undefined}
                            onSubmit={handleUpdateExam}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredExams.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No exams found matching your search." : "No exams created yet."}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
