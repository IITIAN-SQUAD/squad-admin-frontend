import React from "react";

// Card Wrapper
function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl shadow-lg p-6 mb-8 max-w-md border">
      {children}
    </div>
  );
}

// Card Header
function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold tracking-tight text-primary">
        {children}
      </h3>
    </div>
  );
}

// Card Details Header
function CardDetailsHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}

// Card Details Row
function CardDetailsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center py-2 border-b last:border-b-0">
      {children}
    </div>
  );
}

// Card Details Key Item
function CardDetailsKeyItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-32 text-xs font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

// Card Details Value Item
function CardDetailsValueItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-medium ">{children}</span>
  );
}

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
    <CardWrapper>
      <CardHeader>Admin Information</CardHeader>

      <CardDetailsHeader>Details</CardDetailsHeader>
      <div className="space-y-1">
        <CardDetailsRow>
          <CardDetailsKeyItem>Created By:</CardDetailsKeyItem>
          <CardDetailsValueItem>
            {adminInfo.role === "Super Admin" ? "—" : adminInfo.createdBy}
          </CardDetailsValueItem>
        </CardDetailsRow>
        <CardDetailsRow>
          <CardDetailsKeyItem>Level:</CardDetailsKeyItem>
          <CardDetailsValueItem>{adminInfo.level}</CardDetailsValueItem>
        </CardDetailsRow>
        <CardDetailsRow>
          <CardDetailsKeyItem>Role:</CardDetailsKeyItem>
          <CardDetailsValueItem>{adminInfo.role}</CardDetailsValueItem>
        </CardDetailsRow>
        <CardDetailsRow>
          <CardDetailsKeyItem>Created On:</CardDetailsKeyItem>
          <CardDetailsValueItem>{adminInfo.createdOn}</CardDetailsValueItem>
        </CardDetailsRow>
        <CardDetailsRow>
          <CardDetailsKeyItem>Role Updated On:</CardDetailsKeyItem>
          <CardDetailsValueItem>
            {adminInfo.roleUpdatedOn}
          </CardDetailsValueItem>
        </CardDetailsRow>
      </div>
    </CardWrapper>
  );
}
