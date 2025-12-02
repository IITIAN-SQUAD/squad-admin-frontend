"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminInviteSchema, AdminInviteFormData } from "@/src/schemas/admin";
import { Role } from "@/src/types/admin";

interface AdminInviteFormProps {
  roles: Role[];
  onSubmit: (data: AdminInviteFormData) => void;
  onCancel: () => void;
}

export default function AdminInviteForm({ roles, onSubmit, onCancel }: AdminInviteFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminInviteFormData>({
    resolver: zodResolver(adminInviteSchema),
  });

  const selectedRoleId = watch("roleId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{role.name}</span>
                  {role.description && (
                    <span className="text-xs text-gray-500">{role.description}</span>
                  )}
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
          <p className="text-sm text-gray-900 font-medium">
            📧 What happens next:
          </p>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Invitation email sent to the admin</li>
            <li>Email contains a secure link to set password</li>
            <li>Admin sets password and can login</li>
            <li>Link expires in 24 hours</li>
          </ol>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}
