"use client";

import React, { useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, FileText, ChevronRight, ChevronDown } from "lucide-react";
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

// Mock data
const mockExams: Exam[] = [
  {
    id: "1",
    name: "JEE Main 2024",
    description: "Joint Entrance Examination Main",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "NEET 2024",
    description: "National Eligibility cum Entrance Test",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPapers: Paper[] = [
  {
    id: "1",
    name: "JEE Main 2024 - Paper 1",
    examId: "1",
    date: new Date("2024-04-15"),
    totalQuestions: 90,
    totalMarks: 300,
    duration: 10800, // 3 hours in seconds
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "JEE Main 2024 - Paper 2",
    examId: "1",
    date: new Date("2024-04-16"),
    totalQuestions: 82,
    totalMarks: 390,
    duration: 10800,
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function PaperManagementPage() {
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [papers, setPapers] = useState<Paper[]>(mockPapers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const filteredPapers = papers.filter(paper => {
    const matchesSearch = paper.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = !selectedExamId || selectedExamId === "all" || paper.examId === selectedExamId;
    return matchesSearch && matchesExam;
  });

  const handleCreatePaper = (paperData: Omit<Paper, "id" | "createdAt" | "updatedAt" | "sections">) => {
    const newPaper: Paper = {
      ...paperData,
      id: Date.now().toString(),
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPapers([...papers, newPaper]);
    setIsCreateDialogOpen(false);
  };

  const handleUpdatePaper = (paperData: Omit<Paper, "id" | "createdAt" | "updatedAt" | "sections">) => {
    if (!editingPaper) return;
    
    const updatedPaper: Paper = {
      ...paperData,
      id: editingPaper.id,
      sections: editingPaper.sections,
      createdAt: editingPaper.createdAt,
      updatedAt: new Date(),
    };
    
    setPapers(papers.map(paper => paper.id === editingPaper.id ? updatedPaper : paper));
    setEditingPaper(null);
  };

  const handleDeletePaper = (paperId: string) => {
    if (confirm("Are you sure you want to delete this paper?")) {
      setPapers(papers.filter(paper => paper.id !== paperId));
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
              <PaperForm onSubmit={handleCreatePaper} exams={mockExams} />
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
              {mockExams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Papers Table */}
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
                <TableHead>Sections</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPapers.map((paper) => {
                const exam = mockExams.find(e => e.id === paper.examId);
                return (
                  <TableRow key={paper.id}>
                    <TableCell>{paper.name}</TableCell>
                    <TableCell>{exam?.name || "Unknown"}</TableCell>
                    <TableCell>{formatDate(paper.date)}</TableCell>
                    <TableCell>{paper.totalQuestions}</TableCell>
                    <TableCell>{paper.totalMarks}</TableCell>
                    <TableCell>{formatDuration(paper.duration)}</TableCell>
                    <TableCell>{paper.sections.length} sections</TableCell>
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
                              exams={mockExams}
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

        {filteredPapers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || (selectedExamId && selectedExamId !== "all") ? "No papers found matching your criteria." : "No papers created yet."}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
