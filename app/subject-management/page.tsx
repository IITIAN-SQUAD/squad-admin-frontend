"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronRight, ChevronDown, Edit, Trash2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import hierarchyService, { HierarchyNode, HierarchyType } from "@/src/services/hierarchy.service";

interface TreeNode extends HierarchyNode {
  children?: TreeNode[];
  isExpanded?: boolean;
}

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [createType, setCreateType] = useState<HierarchyType>('SUBJECT');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await hierarchyService.getAllSubjects();
      setSubjects(data.map(s => ({ ...s, isExpanded: false })));
    } catch (error: any) {
      alert(error.message || 'Failed to fetch subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const loadChapters = async (subjectId: string) => {
    try {
      const chapters = await hierarchyService.getChaptersBySubject(subjectId);
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, children: chapters.map(c => ({ ...c, isExpanded: false })), isExpanded: true }
          : subject
      ));
    } catch (error: any) {
      alert(error.message || 'Failed to fetch chapters');
    }
  };

  const loadTopics = async (chapterId: string, subjectId: string) => {
    try {
      const topics = await hierarchyService.getTopicsByChapter(chapterId);
      setSubjects(prev => prev.map(subject => {
        if (subject.id === subjectId && subject.children) {
          return {
            ...subject,
            children: subject.children.map(chapter =>
              chapter.id === chapterId
                ? { ...chapter, children: topics, isExpanded: true }
                : chapter
            )
          };
        }
        return subject;
      }));
    } catch (error: any) {
      alert(error.message || 'Failed to fetch topics');
    }
  };

  const toggleNode = (nodeId: string, type: HierarchyType, parentId?: string) => {
    if (type === 'SUBJECT') {
      const subject = subjects.find(s => s.id === nodeId);
      if (subject?.isExpanded) {
        setSubjects(prev => prev.map(s => 
          s.id === nodeId ? { ...s, isExpanded: false, children: [] } : s
        ));
      } else {
        loadChapters(nodeId);
      }
    } else if (type === 'CHAPTER' && parentId) {
      const subject = subjects.find(s => s.id === parentId);
      const chapter = subject?.children?.find(c => c.id === nodeId);
      if (chapter?.isExpanded) {
        setSubjects(prev => prev.map(s => {
          if (s.id === parentId && s.children) {
            return {
              ...s,
              children: s.children.map(c =>
                c.id === nodeId ? { ...c, isExpanded: false, children: [] } : c
              )
            };
          }
          return s;
        }));
      } else {
        loadTopics(nodeId, parentId);
      }
    }
  };

  const openCreateDialog = (type: HierarchyType, parentId?: string) => {
    setCreateType(type);
    setSelectedParentId(parentId || null);
    setEditingNode(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (node: HierarchyNode) => {
    setEditingNode(node);
    setFormName(node.name);
    setFormCode(node.code || "");
    setFormDescription(node.description || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNode) {
        await hierarchyService.updateHierarchy(editingNode.id, {
          name: formName,
          description: formDescription,
        });
        alert('Updated successfully');
      } else {
        if (createType === 'SUBJECT') {
          await hierarchyService.createHierarchy({
            type: 'SUBJECT',
            name: formName,
            code: formCode,
            description: formDescription,
          });
        } else if (createType === 'CHAPTER' && selectedParentId) {
          await hierarchyService.createHierarchy({
            type: 'CHAPTER',
            name: formName,
            parent_id: selectedParentId,
            description: formDescription,
          });
        } else if (createType === 'TOPIC' && selectedParentId) {
          await hierarchyService.createHierarchy({
            type: 'TOPIC',
            name: formName,
            parent_id: selectedParentId,
            description: formDescription,
          });
        }
        alert('Created successfully');
      }
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (error: any) {
      alert(error.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? Ensure no children exist.")) return;
    try {
      await hierarchyService.deleteHierarchy(id);
      fetchSubjects();
      alert('Deleted successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to delete');
    }
  };

  const renderNode = (node: TreeNode, level: number = 0, parentId?: string) => {
    const hasChildren = node.type !== 'TOPIC';
    
    return (
      <div key={node.id} className="mb-2">
        <div className={`border rounded-lg p-4 bg-white ${level > 0 ? 'ml-8' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(node.id, node.type, parentId)}
                >
                  {node.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              )}
              <BookOpen className={`w-5 h-5 ${node.type === 'SUBJECT' ? 'text-blue-600' : node.type === 'CHAPTER' ? 'text-green-600' : 'text-purple-600'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{node.name}</h3>
                  {node.code && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{node.code}</span>
                  )}
                  <span className="text-xs text-gray-500">{node.type}</span>
                </div>
                {node.description && <p className="text-sm text-gray-600">{node.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {node.type === 'SUBJECT' && (
                <Button variant="outline" size="sm" onClick={() => openCreateDialog('CHAPTER', node.id)}>
                  <Plus className="w-4 h-4 mr-1" /> Chapter
                </Button>
              )}
              {node.type === 'CHAPTER' && (
                <Button variant="outline" size="sm" onClick={() => openCreateDialog('TOPIC', node.id)}>
                  <Plus className="w-4 h-4 mr-1" /> Topic
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => openEditDialog(node)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(node.id)} className="text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {node.isExpanded && node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map(child => renderNode(child, level + 1, node.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Subject Management" />
      <PageWrapper>
        <div className="flex justify-between items-center mb-6">
          <PageTitle backButton={{ enabled: false }}>Subject Hierarchy</PageTitle>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => openCreateDialog('SUBJECT')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {subjects.map((subject) => renderNode(subject))}
            {subjects.length === 0 && (
              <p className="text-center text-gray-500 py-8">No subjects found. Create your first subject to get started.</p>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNode ? `Edit ${editingNode.type}` : `Create ${createType}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="Enter name"
                />
              </div>
              {createType === 'SUBJECT' && !editingNode && (
                <div>
                  <Label htmlFor="code">Code * (3 letters)</Label>
                  <Input
                    id="code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    required
                    maxLength={3}
                    placeholder="e.g., MAT, PHY, CHE"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  {editingNode ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
