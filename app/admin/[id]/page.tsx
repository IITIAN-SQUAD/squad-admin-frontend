import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import React from "react";

interface AdminDetailPageProps {
  params: { id: string };
}

// Dummy data for demonstration
const adminInfo = {
  image: "/profile.jpg",
  name: "John Doe",
  email: "john@example.com",
  createdBy: "Jane Smith",
  level: "1",
  role: "Super Admin",
  createdOn: "2024-06-01",
  roleUpdatedOn: "2024-06-10",
};

const roleChangeHistory = [
  {
    previous: "Admin",
    after: "Super Admin",
    changedBy: "Jane Smith",
    changedOn: "2024-06-10",
  },
  // ...more rows
];

const adminAdded = [
  {
    name: "Alice Brown",
    email: "alice@example.com",
    date: "2024-06-12",
  },
  // ...more rows
];

export default function AdminDetailPage({ params }: AdminDetailPageProps) {
  const { id } = params;
  const isSuperAdmin = adminInfo.role === "Super Admin";

  return (
    <>
      <PageHeader title={`Admin Detail`} />
      <PageWrapper>
        <PageTitle>Admin Details</PageTitle>
        {/* Listed Data Section */}
        <section className="mb-8">
          <div className="flex items-center gap-6 mb-4">
            <img
              src={adminInfo.image}
              alt={adminInfo.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <div className="font-bold text-lg">{adminInfo.name}</div>
              <div className="text-sm text-muted-foreground">
                {adminInfo.email}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
        </section>

        {/* Role Change History Table */}
        <section className="mb-8">
          <h2 className="text-md font-semibold mb-4">Role Change History</h2>
          {/* Table structure */}
          <div className="rounded-md border overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Previous Role
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    New Role
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Changed By
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                    Changed On
                  </th>
                </tr>
              </thead>
              <tbody>
                {roleChangeHistory.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2 text-sm">{item.previous}</td>
                    <td className="px-4 py-2 text-sm">{item.after}</td>
                    <td className="px-4 py-2 text-sm">{item.changedBy}</td>
                    <td className="px-4 py-2 text-sm">{item.changedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admin Added Table (only for super admin) */}
        {isSuperAdmin && (
          <section>
            <h2 className="text-md font-semibold mb-4">Admins Added</h2>
            <div className="rounded-md border overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminAdded.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.email}</td>
                      <td className="px-4 py-2 text-sm">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </PageWrapper>
    </>
  );
}
