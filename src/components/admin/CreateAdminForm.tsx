import React from "react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ADMIN_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
];

export default function CreateAdminForm() {
  return (
    <>
      <DialogHeader className="mb-4">
        <DialogTitle>Create Admin</DialogTitle>
      </DialogHeader>
      <form className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="Username" required />
        </div>
        <div className="space-y-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="Email" required />
        </div>
        <div className="space-y-3">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Password" required />
        </div>
        <div className="space-y-3 mb-6">
          <Label htmlFor="role">Role</Label>
          <Select name="role" required>
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </form>
    </>
  );
}
