export default function AdminDashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-bg">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Loading dashboard...</p>
    </div>
  );
}
