'use client';

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="mb-6 text-5xl">✨</div>
      <h2 className="font-heading mb-3 text-2xl font-bold text-accent">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-muted">
        We hit an unexpected issue. Please try again — the show must go on!
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
      >
        Try Again
      </button>
    </div>
  );
}
