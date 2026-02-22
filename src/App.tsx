import { FormEvent, useState } from 'react';

type Status = 'idle' | 'loading' | 'success';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function App() {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStatus('success');
      setEmail('');
    } catch (_submitError) {
      setStatus('idle');
      setError('Could not complete signup. Try again in a minute.');
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-white px-5 py-6 text-zinc-900 sm:py-8">
      <section className="mx-auto flex h-full w-full max-w-[620px] flex-col justify-center gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Window Into The World</p>
          <p className="text-sm text-zinc-500">A project by Landon</p>
        </div>

        <h1 className="font-serif text-[2rem] leading-tight tracking-tight text-zinc-900 sm:text-[2.65rem]">
          See how life actually feels in other countries.
        </h1>

        <p className="max-w-[48ch] text-base leading-7 text-zinc-600">
          Every week, one global question. Real answers from real people around the world.
        </p>

        <form className="grid grid-cols-1 gap-2.5" onSubmit={handleSubmit}>
          <input
            aria-label="Email"
            className="w-full border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-700"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button
            className="border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm text-white transition hover:bg-zinc-800 disabled:cursor-progress disabled:opacity-80"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Joining...' : 'Join'}
          </button>
        </form>

        {status === 'success' ? <p className="-mt-4 text-sm text-zinc-600">Check your inbox.</p> : null}
        {error ? <p className="-mt-4 text-sm text-red-800">{error}</p> : null}

        <hr className="border-0 border-t border-zinc-200" />

        <section className="flex flex-col gap-3" aria-label="Weekly question">
          <h2 className="text-sm font-medium uppercase tracking-[0.06em] text-zinc-500">This week&apos;s question</h2>
          <blockquote className="border-l border-zinc-300 pl-4 font-serif text-[1.4rem] leading-relaxed text-zinc-900 sm:text-[1.55rem]">
            What&apos;s considered rude in your culture?
          </blockquote>
        </section>
      </section>
    </main>
  );
}
