"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaperForm from "@/src/components/paper/PaperForm";
import { PaperEditor } from "@/src/components/paper/PaperEditor";
import { Paper, Exam, PaperSection } from "@/src/types/exam";
import examService from "@/src/services/exam.service";
import paperService from "@/src/services/paper.service";

export default function PaperManagementPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");
  const [selectedExamId, setSelectedExamId] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingPapers, setIsLoadingPapers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoadingExams(true);
      const data = await examService.getAllExams();
      setExams(data);
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
      alert(error.message || 'Failed to fetch exams');
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  // Fetch exams on mount
  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const fetchPapers = useCallback(async (examId?: string) => {
    try {
      setIsLoadingPapers(true);
      const data = await paperService.getAllPapers(examId && examId !== 'all' ? examId : undefined);
      setPapers(data);
    } catch (error: any) {
      console.error('Failed to fetch papers:', error);
      alert(error.message || 'Failed to fetch papers');
    } finally {
      setIsLoadingPapers(false);
    }
  }, []);

  // Fetch papers when exam filter changes (including initial load)
  useEffect(() => {
    const examIdToFetch = selectedExamId !== 'all' ? selectedExamId : undefined;
    fetchPapers(examIdToFetch);
  }, [selectedExamId, fetchPapers]);

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreatePaper = async (paperData: Omit<Paper, "id" | "createdAt" | "updatedAt" | "sections">) => {
    try {
      setIsSubmitting(true);
      const newPaper = await paperService.createPaper({
        examId: paperData.examId,
        name: paperData.name,
        date: paperData.date,
        totalQuestions: paperData.totalQuestions,
        totalMarks: paperData.totalMarks,
        duration: paperData.duration,
      });
      setPapers([...papers, newPaper]);
      setIsCreateDialogOpen(false);
      alert('Paper created successfully');
    } catch (error: any) {
      console.error('Failed to create paper:', error);
      alert(error.message || 'Failed to create paper');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaper = async (paperData: Omit<Paper, "id" | "createdAt" | "updatedAt" | "sections">) => {
    if (!editingPaper) return;
    
    try {
      setIsSubmitting(true);
      const updatedPaper = await paperService.updatePaper(editingPaper.id, {
        name: paperData.name,
        date: paperData.date,
        totalQuestions: paperData.totalQuestions,
        totalMarks: paperData.totalMarks,
        duration: paperData.duration,
      });
      setPapers(papers.map(paper => paper.id === editingPaper.id ? updatedPaper : paper));
      setEditingPaper(null);
      alert('Paper updated successfully');
    } catch (error: any) {
      console.error('Failed to update paper:', error);
      alert(error.message || 'Failed to update paper');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm("Are you sure you want to delete this paper? It will be archived.")) return;
    
    try {
      await paperService.deletePaper(paperId);
      fetchPapers(selectedExamId !== 'all' ? selectedExamId : undefined); // Refresh list
      alert('Paper archived successfully');
    } catch (error: any) {
      console.error('Failed to delete paper:', error);
      alert(error.message || 'Failed to delete paper');
    }
  };

  const handleTogglePaperStatus = async (paperId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    if (!confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      await paperService.updatePaperStatus(paperId, newStatus as any);
      fetchPapers(selectedExamId !== 'all' ? selectedExamId : undefined); // Refresh list
      alert(`Status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (selectedPaper) {
    return (
      <>
        <PageHeader title="Paper Editor" />
        <PageWrapper>
          <PaperEditor
            paper={selectedPaper}
            onBack={() => setSelectedPaper(null)}
            onUpdate={(updatedPaper) => {
              setPapers(papers.map(p => p.id === updatedPaper.id ? updatedPaper : p));
              setSelectedPaper(updatedPaper);
            }}
          />
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Paper Management" />
      <PageWrapper>
        <div className="flex justify-between items-center mb-6">
          <PageTitle backButton={{ enabled: false }}>Paper Onboarding</PageTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add New Paper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Paper</DialogTitle>
              </DialogHeader>
              <PaperForm onSubmit={handleCreatePaper} exams={exams} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoadingPapers && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            <span className="ml-2 text-gray-600">Loading papers...</span>
          </div>
        )}

        {/* Papers Table */}
        {!isLoadingPapers && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paper Name</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredPapers.map((paper) => {
                const exam = exams.find(e => e.id === paper.examId);
                return (
                  <TableRow key={paper.id}>
                    <TableCell>{paper.name}</TableCell>
                    <TableCell>{paper.examName || exam?.name || "Unknown"}</TableCell>
                    <TableCell>{formatDate(paper.date)}</TableCell>
                    <TableCell>{paper.totalQuestions}</TableCell>
                    <TableCell>{paper.totalMarks}</TableCell>
                    <TableCell>{formatDuration(paper.duration)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePaperStatus(paper.id, paper.status)}
                        className={`text-xs ${
                          paper.status === 'PUBLISHED' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {paper.status}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPaper(paper)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Edit Structure
                        </Button>
                        <Dialog open={editingPaper?.id === paper.id} onOpenChange={(open) => !open && setEditingPaper(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPaper(paper)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Paper</DialogTitle>
                            </DialogHeader>
                            <PaperForm 
                              initialData={editingPaper || undefined}
                              onSubmit={handleUpdatePaper}
                              exams={exams}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaper(paper.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPapers && filteredPapers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || (selectedExamId && selectedExamId !== "all") ? "No papers found matching your criteria." : "No papers created yet."}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
