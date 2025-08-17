import HomeHeader from "@/src/components/page/home-header";


export default function Home() {
  return (
    <>
      <HomeHeader />
      <div className="px-6 py-4">
        <div className="bg-card rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            Welcome to IITian Squad Admin Panel
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Manage admins and platform users</li>
            <li>View analytics and activity logs</li>
            <li>Access platform settings and controls</li>
          </ul>
        </div>
      </div>
    </>
  );
}
