"use client";

import React, { useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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

// Mock data - replace with actual API calls
const mockExams: Exam[] = [
  {
    id: "1",
    name: "JEE Main 2024",
    description: "Joint Entrance Examination Main for engineering admissions",
    countries: ["India"],
    metadata: [
      { key: "conducting_body", value: "NTA" },
      { key: "mode", value: "Online" },
    ],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "NEET 2024",
    description: "National Eligibility cum Entrance Test for medical admissions",
    countries: ["India"],
    metadata: [
      { key: "conducting_body", value: "NTA" },
      { key: "mode", value: "Offline" },
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-20"),
  },
];

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>(mockExams);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateExam = (examData: Omit<Exam, "id" | "createdAt" | "updatedAt">) => {
    const newExam: Exam = {
      ...examData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setExams([...exams, newExam]);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateExam = (examData: Omit<Exam, "id" | "createdAt" | "updatedAt">) => {
    if (!editingExam) return;
    
    const updatedExam: Exam = {
      ...examData,
      id: editingExam.id,
      createdAt: editingExam.createdAt,
      updatedAt: new Date(),
    };
    
    setExams(exams.map(exam => exam.id === editingExam.id ? updatedExam : exam));
    setEditingExam(null);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      setExams(exams.filter(exam => exam.id !== examId));
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

        {/* Exams Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Metadata</TableHead>
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
                    <div className="flex flex-wrap gap-1">
                      {exam.metadata.slice(0, 2).map((meta, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {meta.key}: {meta.value}
                        </span>
                      ))}
                      {exam.metadata.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{exam.metadata.length - 2} more
                        </span>
                      )}
                    </div>
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

        {filteredExams.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No exams found matching your search." : "No exams created yet."}
          </div>
        )}
      </PageWrapper>
    </>
  );
}
