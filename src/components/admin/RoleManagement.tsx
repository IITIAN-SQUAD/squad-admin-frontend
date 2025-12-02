"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Role, Permission } from "@/src/types/admin";

interface RoleManagementProps {
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
}

const allPermissions: { value: Permission; label: string; description: string }[] = [
  { value: 'exam_management', label: 'Exam Management', description: 'Create and manage exams' },
  { value: 'subject_management', label: 'Subject Management', description: 'Manage subjects and topics' },
  { value: 'paper_management', label: 'Paper Management', description: 'Create and manage papers' },
  { value: 'question_management', label: 'Question Management', description: 'Create and manage questions' },
  { value: 'blog_management', label: 'Blog Management', description: 'Manage blog posts' },
  { value: 'author_management', label: 'Author Management', description: 'Manage authors' },
  { value: 'media_management', label: 'Media Management', description: 'Manage media library' },
  { value: 'admin_management', label: 'Admin Management', description: 'Manage admin users (Super Admin only)' },
  { value: 'bulk_upload', label: 'Bulk Upload', description: 'Upload questions in bulk' },
];

export default function RoleManagement({ roles, onRolesChange }: RoleManagementProps) {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[],
  });

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsCreating(false);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
  };

  const handleSave = () => {
    if (isCreating) {
      const newRole: Role = {
        id: Date.now().toString(),
        name: formData.name,
        type: 'admin',
        description: formData.description,
        permissions: formData.permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onRolesChange([...roles, newRole]);
    } else if (editingRole) {
      onRolesChange(
        roles.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
                updatedAt: new Date(),
              }
            : role
        )
      );
    }
    handleCancel();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const handleDelete = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      onRolesChange(roles.filter((role) => role.id !== roleId));
    }
  };

  const togglePermission = (permission: Permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Create New Button */}
      {!isCreating && !editingRole && (
        <Button
          onClick={handleCreateNew}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Role
        </Button>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingRole) && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle>{isCreating ? 'Create New Role' : 'Edit Role'}</CardTitle>
            <CardDescription>
              Define role name, description, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allPermissions.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onCheckedChange={() => togglePermission(permission.value)}
                      disabled={permission.value === 'admin_management' && editingRole?.type === 'super_admin'}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={permission.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                disabled={!formData.name || formData.permissions.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Role
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className={editingRole?.id === role.id ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.description && (
                    <CardDescription className="mt-1">{role.description}</CardDescription>
                  )}
                </div>
                {role.type !== 'super_admin' && !editingRole && !isCreating && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {allPermissions.find((p) => p.value === permission)?.label || permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
