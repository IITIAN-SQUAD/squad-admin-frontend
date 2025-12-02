"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Mail, UserX, UserCheck, Shield } from "lucide-react";
import { Admin, Role } from "@/src/types/admin";
import AdminInviteForm from "@/src/components/admin/AdminInviteForm";
import RoleManagement from "@/src/components/admin/RoleManagement";

// Mock data
const mockRoles: Role[] = [
  {
    id: "1",
    name: "Super Admin",
    type: "super_admin",
    permissions: [
      'exam_management',
      'subject_management',
      'paper_management',
      'question_management',
      'blog_management',
      'author_management',
      'media_management',
      'admin_management',
      'bulk_upload',
    ],
    description: "Full system access",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Content Manager",
    type: "admin",
    permissions: [
      'exam_management',
      'subject_management',
      'paper_management',
      'question_management',
      'bulk_upload',
    ],
    description: "Manage exams and questions",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Blog Editor",
    type: "content_editor",
    permissions: ['blog_management', 'author_management', 'media_management'],
    description: "Manage blog content",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAdmins: Admin[] = [
  {
    id: "1",
    email: "super@iitian-squad.com",
    name: "Super Admin",
    roleId: "1",
    role: mockRoles[0],
    isActive: true,
    passwordSet: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    email: "content@iitian-squad.com",
    name: "Content Manager",
    roleId: "2",
    role: mockRoles[1],
    isActive: true,
    passwordSet: true,
    lastLogin: new Date(Date.now() - 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    email: "editor@iitian-squad.com",
    name: "Blog Editor",
    roleId: "3",
    role: mockRoles[2],
    isActive: false,
    passwordSet: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function AdminManagementContent() {
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteAdmin = async (data: { email: string; roleId: string }) => {
    try {
      // TODO: Backend will handle sending invitation email
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // For demo, add to list with pending status
      const selectedRole = roles.find(r => r.id === data.roleId);
      const newAdmin: Admin = {
        id: Date.now().toString(),
        email: data.email,
        name: data.email.split('@')[0], // Use email prefix as name
        roleId: data.roleId,
        role: selectedRole,
        isActive: false,
        passwordSet: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setAdmins([...admins, newAdmin]);
      setShowInviteDialog(false);

      // Show success message (you can add a toast notification here)
      alert(`Invitation sent to ${data.email}!\n\nThey will receive an email with a link to set their password.`);
    } catch (error) {
      console.error('Failed to invite admin:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleResendInvite = async (adminId: string) => {
    const admin = admins.find(a => a.id === adminId);
    if (!admin) return;

    try {
      // TODO: Backend will resend invitation email
      const response = await fetch('/api/admin/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, email: admin.email }),
      });

      alert(`Invitation resent to ${admin.email}!\n\nThey will receive a new email with a link to set their password.`);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      alert('Failed to resend invitation. Please try again.');
    }
  };

  const handleToggleStatus = (adminId: string) => {
    setAdmins(admins.map(admin => 
      admin.id === adminId ? { ...admin, isActive: !admin.isActive } : admin
    ));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowRolesDialog(true)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
            onClick={() => setShowInviteDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search admins by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{admin.role?.name}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {admin.isActive ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {!admin.passwordSet && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Pending
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {admin.lastLogin ? formatDate(admin.lastLogin) : "Never"}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDate(admin.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!admin.passwordSet && (
                        <DropdownMenuItem onClick={() => handleResendInvite(admin.id)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Resend Invitation
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleStatus(admin.id)}>
                        {admin.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
            <DialogDescription>
              Send an invitation email to a new admin user
            </DialogDescription>
          </DialogHeader>
          <AdminInviteForm
            roles={roles}
            onSubmit={handleInviteAdmin}
            onCancel={() => setShowInviteDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Role Management</DialogTitle>
            <DialogDescription>
              Create and manage roles with specific permissions
            </DialogDescription>
          </DialogHeader>
          <RoleManagement
            roles={roles}
            onRolesChange={setRoles}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
