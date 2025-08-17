import React from "react";

interface AdminInfo {
  image: string;
  name: string;
  email: string;
  createdBy: string;
  level: string;
  role: string;
  createdOn: string;
  roleUpdatedOn: string;
}

interface AdminInfoCardProps {
  adminInfo: AdminInfo;
}

export default function AdminInfoCard({ adminInfo }: AdminInfoCardProps) {
  return (
    <div className="bg-card rounded-lg shadow p-6 mb-8 max-w-md">
      <div className="font-semibold text-md mb-4">Admin Information</div>
      <div className="space-y-2">
        <div>
          <span className="font-medium">Created By:</span>{" "}
          {adminInfo.role === "Super Admin" ? "—" : adminInfo.createdBy}
        </div>
        <div>
          <span className="font-medium">Level:</span> {adminInfo.level}
        </div>
        <div>
          <span className="font-medium">Role:</span> {adminInfo.role}
        </div>
        <div>
          <span className="font-medium">Created On:</span> {adminInfo.createdOn}
        </div>
        <div>
          <span className="font-medium">Role Updated On:</span>{" "}
          {adminInfo.roleUpdatedOn}
        </div>
      </div>
    </div>
  );
}
