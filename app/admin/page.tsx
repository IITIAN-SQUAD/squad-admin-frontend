import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import React from "react";
import { User, Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <header className="w-full border-b px-6 py-4 flex items-center bg-background sticky top-0">
        <h1 className="text-sm font-medium">Admin List</h1>
        {/* Add nav links or actions here if needed */}
      </header>
      <div className="p-8">
        <h1 className="text-xl font-bold mb-4">Admin Listing</h1>
        {/* Analytics Section */}
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Total Admins" value={42} icon={<User />} />
            <AnalyticsCard title="Platform Admins" value={7} icon={<Shield />} />
          </div>
        </Section>

        <Section>
          <SectionHeader>Admin management</SectionHeader>
        </Section>
      </div>
      <div className="h-[100vh]" />
    </>
  );
}
