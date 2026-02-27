'use client';

function Reveal({ children, className }: { children: React.ReactNode; className?: string; delay?: number; x?: number; y?: number; duration?: number }) {
  return <div className={className}>{children}</div>;
}

export function TrialContact() {
  return (
    <section className="-mt-[10px] w-full bg-[#120456] text-white">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#f4bf1a] to-transparent" />

      <div className="relative overflow-hidden px-4 pb-24 pt-14 md:px-8 md:pb-28 md:pt-16">
        <div className="pointer-events-none absolute left-1/2 top-[30%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(177,59,255,0.18)_0%,transparent_72%)]" />

        <Reveal className="relative mx-auto max-w-[760px] text-center">
          <h2 className="text-[34px] font-black tracking-tight md:text-[52px]">
            Start your 30-day free trial
          </h2>
          <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.35] text-white/55 md:text-[15px]">
            Join over 4,000+ startups already scaling their architecture with
            Centric.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              className="rounded-full border border-white/22 px-8 py-2.5 text-[13px] font-bold text-white transition hover:bg-white/10"
            >
              Learn more
            </button>
            <button
              type="button"
              className="rounded-full bg-[#f5c400] px-9 py-2.5 text-[13px] font-extrabold text-[#140d3d] transition hover:brightness-105"
            >
              Get Started
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="relative">
          <div className="relative left-1/2 mt-[64px] h-[2px] w-screen -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f4bf1a] to-transparent" />
          <div className="relative left-1/2 h-7 w-screen -translate-x-1/2 bg-gradient-to-b from-[#f4bf1a]/16 via-[#f4bf1a]/6 to-transparent blur-[1px]" />
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-[760px] text-center">
          <h3 className="text-[46px] font-black tracking-tight md:text-[50px]">
            Contact{' '}
            <span className="relative inline-block">
              Us
              <span
                className="absolute -bottom-0.5 left-0 h-[3px] w-full rounded bg-[#a855f7]"
                aria-hidden
              />
            </span>
          </h3>
          <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-[1.35] text-white/55 md:text-[15px]">
            Connect with our deployment team to scale your architecture globally.
          </p>
        </Reveal>

        <div className="relative mx-auto mt-12 w-full max-w-[1100px] grid items-start gap-6 sm:grid-cols-[500px_1fr] sm:gap-6 md:mt-14 md:gap-7">
          <Reveal x={-20} delay={0.14}>
          <form className="mx-auto w-full max-w-[500px] rounded-[2rem] border border-white/12 bg-[#10164a]/86 p-9 shadow-[0_18px_45px_rgba(5,4,22,0.42)]">
            <h4 className="whitespace-nowrap text-[22px] font-extrabold uppercase tracking-[0.02em] text-white md:text-[24px]">
              Get in touch with us
            </h4>

            <div className="mt-6 space-y-3.5">
              <div>
                <label className="mb-2 block text-[11px] font-semibold text-white/82" htmlFor="contact-name">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="h-[32px] w-full rounded-[10px] border border-white/8 bg-[#192058] px-4 text-white placeholder:text-white/30 focus:border-[#a855f7] focus:outline-none"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-white/82" htmlFor="contact-company">
                  Company Name
                </label>
                <input
                  id="contact-company"
                  type="text"
                  className="h-[32px] w-full rounded-[10px] border border-white/8 bg-[#192058] px-4 text-white placeholder:text-white/30 focus:border-[#a855f7] focus:outline-none"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold text-white/82" htmlFor="contact-email">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className="h-[32px] w-full rounded-[10px] border border-white/8 bg-[#192058] px-4 text-white placeholder:text-white/30 focus:border-[#a855f7] focus:outline-none"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-7 h-[42px] w-full rounded-[10px] bg-gradient-to-r from-[#8b3dff] to-[#c026d3] px-6 text-[16px] font-extrabold leading-none text-white transition hover:brightness-110"
              suppressHydrationWarning
            >
              Submit
            </button>
          </form>
          </Reveal>

          <div className="relative hidden min-h-[430px] sm:block" aria-hidden>
            <div className="absolute inset-0">
              <div className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.24),rgba(40,15,120,0.08)_45%,rgba(0,0,0,0)_74%)] blur-[8px]" />

              <div className="absolute right-6 top-6 h-[360px] w-[360px] rounded-full border border-[#4b24a8]/28" />
              <div className="absolute right-16 top-12 h-[330px] w-[330px] rounded-full border border-[#4b24a8]/22" />

              <div className="absolute right-[52px] top-[32px] h-[340px] w-[220px] rotate-[10deg] rounded-[50%] border border-[#5f34c4]/22" />
              <div className="absolute right-[102px] top-[40px] h-[325px] w-[190px] -rotate-[10deg] rounded-[50%] border border-[#5f34c4]/16" />

              <div className="absolute right-[90px] top-[126px] h-[205px] w-[205px] rounded-full bg-[radial-gradient(ellipse_at_60%_45%,rgba(168,85,247,0.24)_0%,rgba(80,35,178,0.14)_34%,rgba(10,5,72,0)_74%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
