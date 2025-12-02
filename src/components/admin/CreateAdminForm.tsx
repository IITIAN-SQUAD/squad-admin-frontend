"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail } from "lucide-react";
import { adminInviteSchema, AdminInviteFormData } from "@/src/schemas/admin";

const ADMIN_ROLES = [
  { 
    id: "1",
    value: "super_admin", 
    label: "Super Admin",
    description: "Full system access"
  },
  { 
    id: "2",
    value: "admin", 
    label: "Content Manager",
    description: "Manage exams and questions"
  },
  { 
    id: "3",
    value: "content_editor", 
    label: "Blog Editor",
    description: "Manage blog content"
  },
];

interface CreateAdminFormProps {
  onSuccess?: () => void;
}

export default function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AdminInviteFormData>({
    resolver: zodResolver(adminInviteSchema),
  });

  const selectedRoleId = watch("roleId");

  const onSubmit = async (data: AdminInviteFormData) => {
    try {
      setError(null);
      
      // TODO: Backend will handle sending invitation email
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // For demo, show success
      setSuccess(true);
      
      // Show success message
      setTimeout(() => {
        alert(`Invitation sent to ${data.email}!\n\nThey will receive an email with a link to set their password.`);
        reset();
        setSuccess(false);
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle>Invite Admin</DialogTitle>
        <DialogDescription>
          Send an invitation email to a new admin user
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Admin will receive an email with a link to set their password
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleId">Role *</Label>
          <Select
            value={selectedRoleId}
            onValueChange={(value) => setValue("roleId", value)}
          >
            <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_ROLES.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{role.label}</span>
                    <span className="text-xs text-gray-500">{role.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.roleId && (
            <p className="text-sm text-red-500">{errors.roleId.message}</p>
          )}
        </div>

        {selectedRoleId && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
            <p className="text-sm text-gray-900 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              What happens next:
            </p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-1">
              <li>Invitation email sent to the admin</li>
              <li>Email contains a secure link to set password</li>
              <li>Admin sets password and can login</li>
              <li>Link expires in 24 hours</li>
            </ol>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
