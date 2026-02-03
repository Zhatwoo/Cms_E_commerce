'use client';

import dynamic from 'next/dynamic';

const Globe3D = dynamic(
  () => import('./Globe3D').then((m) => m.Globe3D),
  { ssr: false }
);

export function Testimonials() {
  return (
    <section className="relative flex-shrink-0 w-full overflow-hidden bg-transparent px-6 pt-8 pb-8 md:px-10 md:pt-12 md:pb-12">
      {/* Gradient background with clip-path — raised 10% from previous */}
      <div
        className="absolute inset-0 z-0 w-full"
        style={{
          background: 'linear-gradient(to right, #06143E 0%, transparent 50%), linear-gradient(to bottom, #0a2a7a 0%, #020b2a 28%, #020205 58%, #020205 100%)',
          clipPath: 'polygon(0 20%, 100% 5%, 100% 100%, 0 100%)',
          transform: 'translateY(10%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* 3D Globe — right 30% of section (from github-globe-main) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center"
          aria-hidden
        >
          <div
            className="absolute left-[100%] top-[85%] aspect-square h-[min(126.72vmin,66.528rem)] w-[min(126.72vmin,66.528rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full md:h-[min(142.56vmin,76.032rem)] md:w-[min(142.56vmin,76.032rem)]"
            style={{ isolation: 'isolate' }}
          >
            <Globe3D className="absolute inset-0 size-full" />
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 35%, rgba(2, 11, 42, 0.3) 60%, rgba(0, 0, 0, 0.7) 100%)',
              }}
              aria-hidden
            />
          </div>
        </div>

        {/* What they say about us */}
        <div className="relative z-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            What they{' '}
            <span className="relative inline-block">
              say about us.
              <span
                className="absolute -bottom-1 left-0 h-0.5 w-full bg-blue-500"
                aria-hidden
              />
            </span>
          </h2>
        </div>

        {/* Contact Us — in place of testimonial cards; minimal gap before footer */}
        <div className="relative z-20 mb-6 mt-12 max-w-4xl translate-x-[-15%] translate-y-[12%] md:mt-16 md:mb-8">
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-white bg-black p-8 shadow-xl md:p-10">
            <h3 className="text-center text-2xl font-bold text-white md:text-3xl">
              Contact Us
            </h3>
            <form className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-white">
                  First Name:
                </label>
                <input
                  id="first-name"
                  type="text"
                  className="w-full rounded-lg border border-neutral-600 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
              <div>
                <label htmlFor="last-name" className="mb-2 block text-sm font-medium text-white">
                  Last Name:
                </label>
                <input
                  id="last-name"
                  type="text"
                  className="w-full rounded-lg border border-neutral-600 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
              <div>
                <label htmlFor="company" className="mb-2 block text-sm font-medium text-white">
                  Company:
                </label>
                <input
                  id="company"
                  type="text"
                  className="w-full rounded-lg border border-neutral-600 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white">
                  Email:
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-lg border border-neutral-600 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder=""
                />
              </div>
            </form>
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="rounded-lg border-2 border-white bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
