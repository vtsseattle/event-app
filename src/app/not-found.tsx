import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="mb-6 text-6xl">🎭</div>
      <h1 className="font-heading mb-3 text-4xl font-bold text-accent">
        Page Not Found
      </h1>
      <p className="mb-8 max-w-md text-muted">
        This page doesn&apos;t exist — but the event is still on! Head back and
        enjoy the show.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
      >
        Back to Home
      </Link>
    </div>
  );
}
