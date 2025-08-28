import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

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
    <Card className="max-w-md border overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold tracking-tight text-primary">
          Admin Information
        </CardTitle>
      </CardHeader>

      <CardContent className="">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Details
        </div>

        <div className="space-y-1">
          <div className="flex items-center py-2 border-b last:border-b-0">
            <span className="w-32 text-xs font-semibold text-muted-foreground">
              Created By:
            </span>
            <span className="text-sm font-medium ">
              {adminInfo.role === "Super Admin" ? "—" : adminInfo.createdBy}
            </span>
          </div>

          <div className="flex items-center py-2 border-b last:border-b-0">
            <span className="w-32 text-xs font-semibold text-muted-foreground">
              Level:
            </span>
            <span className="text-sm font-medium ">{adminInfo.level}</span>
          </div>

          <div className="flex items-center py-2 border-b last:border-b-0">
            <span className="w-32 text-xs font-semibold text-muted-foreground">
              Role:
            </span>
            <span className="text-sm font-medium ">{adminInfo.role}</span>
          </div>

          <div className="flex items-center py-2 border-b last:border-b-0">
            <span className="w-32 text-xs font-semibold text-muted-foreground">
              Created On:
            </span>
            <span className="text-sm font-medium ">{adminInfo.createdOn}</span>
          </div>

          <div className="flex items-center py-2 border-b last:border-b-0">
            <span className="w-32 text-xs font-semibold text-muted-foreground">
              Role Updated On:
            </span>
            <span className="text-sm font-medium ">
              {adminInfo.roleUpdatedOn}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
