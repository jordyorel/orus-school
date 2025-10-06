import { Link } from "react-router-dom";

const navigation = [
  { label: "About", href: "#about" },
  { label: "Curriculum", href: "#curriculum" },
  { label: "Experience", href: "#experience" },
  { label: "Pricing", href: "#apply" }
];

const curriculum = [
  {
    title: "Year 1 · Foundations",
    icon: "💻",
    description:
      "Master the pillars of software engineering with C, Unix, algorithms, and networking before shipping a full capstone like a web server or multiplayer game.",
    modules: ["C Programming", "Unix Mastery", "Algorithms", "Networking", "Capstone Project"]
  },
  {
    title: "Year 2 · Specialisations",
    icon: "⚡",
    description:
      "Choose a professional pathway in AI, cybersecurity, web, or computer graphics while collaborating on an ambitious final product for your portfolio.",
    modules: ["AI & Data", "Cybersecurity", "Modern Web", "Computer Graphics", "Final Capstone"]
  }
];

const features = [
  {
    title: "Mentorship",
    icon: "👨‍🏫",
    description: "Each student pairs with an industry mentor who reviews code and guides growth."
  },
  {
    title: "Portfolio",
    icon: "📂",
    description: "Graduate with 10+ real-world GitHub projects demonstrating professional skills."
  },
  {
    title: "Job Ready",
    icon: "🌍",
    description: "Our curriculum mirrors company expectations so you can succeed from day one."
  },
  {
    title: "Small Classes",
    icon: "🎯",
    description: "Only 10 students per cohort ensures focused, personalised coaching."
  }
];

const experiences = [
  {
    title: "Progress Dashboard",
    description:
      "Track milestones, attendance, and mentor feedback with a visual dashboard designed for accountability.",
    illustration: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-blue-600"
  },
  {
    title: "Project Submissions",
    description:
      "Submit assignments, receive inline reviews, and iterate quickly using our GitHub-integrated workflow.",
    illustration: "bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-600"
  },
  {
    title: "Gamified Path",
    description:
      "Unlock levels, earn badges, and celebrate achievements as you progress through each sprint.",
    illustration: "bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500"
  }
];

const testimonials = [
  {
    quote:
      "I built my first web server in just three months. The mentorship and support gave me the confidence to aim higher.",
    name: "Arielle, Year 1 Student"
  },
  {
    quote:
      "After the AI specialisation I landed an internship with a startup in Brazzaville. The projects truly speak for themselves.",
    name: "Kevin, Year 2 Student"
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900 to-slate-950" />
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[680px] max-w-6xl flex-col px-6 py-8 md:py-16">
          <nav className="flex items-center justify-between text-sm font-medium">
            <div className="text-lg font-semibold tracking-tight">Orus School</div>
            <div className="hidden items-center gap-8 md:flex">
              {navigation.map((item) => (
                <a key={item.label} href={item.href} className="transition hover:text-emerald-300">
                  {item.label}
                </a>
              ))}
            </div>
            <Link
              to="/login"
              className="hidden rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-wide transition hover:border-white hover:bg-white/10 md:block"
            >
              Student Portal
            </Link>
          </nav>
          <div className="mt-12 flex flex-1 flex-col-reverse items-center gap-12 md:mt-20 md:flex-row md:items-start">
            <div className="w-full space-y-6 md:w-3/5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-wide">
                Modern Coding Academy · Brazzaville
              </span>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                Become a Software Engineer in 2 Years
              </h1>
              <p className="max-w-xl text-lg text-slate-200">
                Learn by building real projects, guided by mentors who live and breathe software. We combine rigorous
                foundations with Congo-Brazzaville context so you can launch an international tech career without leaving
                home.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="#apply"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                >
                  Apply Now
                </a>
                <a
                  href="#curriculum"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Learn More
                </a>
                <Link
                  to="/playground"
                  className="inline-flex items-center justify-center rounded-full bg-white/10 px-8 py-3 text-sm font-semibold text-white shadow-inner transition hover:bg-white/20"
                >
                  Try the Playground
                </Link>
              </div>
              <div className="grid gap-6 pt-8 sm:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-white">2</p>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Years to Career Ready</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">10</p>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Students per Cohort</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">10+</p>
                  <p className="text-xs uppercase tracking-wide text-slate-300">Portfolio Projects</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/5">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/30 blur-2xl" />
                <div className="absolute -left-10 bottom-0 h-52 w-52 rounded-full bg-sky-500/20 blur-2xl" />
                <div className="relative space-y-4 text-left text-slate-100">
                  <h2 className="text-lg font-semibold">What you will build</h2>
                  <ul className="space-y-3 text-sm text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-300">◆</span>
                      <span>Low-level networking stack with C and Unix tooling.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-300">◆</span>
                      <span>Production-ready APIs, dashboards, and mobile-first web apps.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-300">◆</span>
                      <span>AI, cybersecurity, or graphics capstone solving real Congolese problems.</span>
                    </li>
                  </ul>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-200">Mentor Highlight</p>
                    <p className="mt-2 text-sm text-white">
                      "We train students the way we onboard junior engineers — code reviews, agile rituals, and real
                      deadlines." — Mireille, Lead Mentor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="about" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">A mission to unlock Congo's next tech leaders</h2>
              <p className="text-lg text-slate-600">
                Orus School delivers elite software engineering education tailored for Congo-Brazzaville. Our two-year
                journey is built on project-based learning, mentorship, and community. Students learn in studios, not
                lecture halls, building products that answer real needs from local organisations and partners.
              </p>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Project-based sprints that mirror professional engineering teams.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Maximum of 10 students per cohort for personalised attention.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Career coaching, interview preparation, and employer networking.</span>
                </li>
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 text-white shadow-2xl">
              <div className="absolute right-6 top-6 h-16 w-16 rounded-full bg-emerald-400/30 blur-2xl" />
              <div className="absolute bottom-6 left-6 h-24 w-24 rounded-full bg-blue-500/30 blur-2xl" />
              <div className="relative space-y-6">
                <p className="text-sm uppercase tracking-wide text-emerald-200">Inside the studio</p>
                <h3 className="text-2xl font-semibold">Build, ship, present</h3>
                <p className="text-sm text-slate-200">
                  Students pair-program, run stand-ups, and present demos every sprint. Mentors provide live feedback so
                  everyone grows together.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold text-white">30+</p>
                    <p className="text-xs uppercase tracking-wide text-slate-200">Industry Mentors</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-3xl font-semibold text-white">85%</p>
                    <p className="text-xs uppercase tracking-wide text-slate-200">Hiring Rate*</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300">*From our latest alumni cohort working across Africa & Europe.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="curriculum" className="bg-slate-900 py-20 text-white md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">Program overview</h2>
                <p className="mt-3 max-w-xl text-slate-300">
                  A structured journey from foundations to advanced specialisations. Each year ends with a capstone
                  project showcased to partners and employers.
                </p>
              </div>
              <a
                href="#apply"
                className="inline-flex items-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
              >
                Reserve your seat
              </a>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {curriculum.map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{item.icon}</span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{item.description}</p>
                  <ul className="mt-6 space-y-2 text-sm text-slate-200">
                    {item.modules.map((module) => (
                      <li key={module} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{module}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="flex flex-col gap-12 md:flex-row md:items-start">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Why choose Orus School?</h2>
              <p className="mt-4 text-slate-600">
                From mentorship to career outcomes, we built every detail to help Congolese talent compete globally.
              </p>
            </div>
            <div className="grid flex-1 gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="bg-slate-50 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">A platform built for momentum</h2>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Our digital campus keeps students connected, accountable, and inspired. Every interaction is designed to
                  support consistent progress and celebrate wins.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Preview the portal
              </Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {experiences.map((experience) => (
                <div key={experience.title} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className={`h-40 rounded-2xl ${experience.illustration}`} />
                  <h3 className="text-lg font-semibold text-slate-900">{experience.title}</h3>
                  <p className="text-sm text-slate-600">{experience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="rounded-3xl bg-slate-900 p-10 text-white md:p-16">
            <div className="grid gap-10 md:grid-cols-3">
              <div className="md:col-span-1">
                <h2 className="text-3xl font-bold md:text-4xl">Student voices</h2>
                <p className="mt-4 text-slate-300">Stories from learners transforming their future through code.</p>
              </div>
              <div className="md:col-span-2 grid gap-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-lg text-slate-100">“{testimonial.quote}”</p>
                    <p className="mt-4 text-sm font-semibold text-emerald-200">{testimonial.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-emerald-400 py-16 text-slate-900 md:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="text-sm uppercase tracking-wide">Limited seats · Only 10 students</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Secure your place in the next cohort</h2>
            </div>
            <a
              href="#apply"
              className="inline-flex items-center rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Apply Now
            </a>
          </div>
        </section>

        <section id="apply" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Tuition & enrollment</h2>
              <p className="text-lg text-slate-600">
                Our program is intentionally affordable. We offer monthly and yearly payment plans with scholarships for
                outstanding applicants.
              </p>
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-sm uppercase tracking-wide text-slate-500">Investment</p>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 text-slate-900">
                  <span className="text-4xl font-bold">15,000–25,000 FCFA</span>
                  <span className="text-sm text-slate-500">per month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    <span>24 month immersive journey with mentor support.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Flexible payment plans: monthly, quarterly, or yearly.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Scholarships available for high-impact community projects.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Ready to begin?</h3>
              <p className="mt-3 text-sm text-slate-600">
                Tell us about your ambitions and we will schedule an interview to explore if Orus School is the right fit.
              </p>
              <form className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ex: Amandine Mabiala"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500" htmlFor="message">
                    Motivation
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="What would you love to build?"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                >
                  Register Interest
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-lg font-semibold">Orus School</h3>
            <p className="text-sm text-slate-300">Modern coding academy empowering the next generation of Congolese innovators.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>
                <a className="transition hover:text-white" href="#about">
                  About
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#curriculum">
                  Curriculum
                </a>
              </li>
              <li>
                <a className="transition hover:text-white" href="#apply">
                  Apply
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>📧 hello@orusschool.com</li>
              <li>📞 +242 06 123 4567</li>
              <li>📍 Brazzaville, Congo</li>
            </ul>
            <div className="mt-4 flex gap-3 text-lg text-slate-300">
              <a href="#" className="transition hover:text-white" aria-label="Facebook">
                <span aria-hidden>🔵</span>
              </a>
              <a href="#" className="transition hover:text-white" aria-label="LinkedIn">
                <span aria-hidden>💼</span>
              </a>
              <a href="#" className="transition hover:text-white" aria-label="TikTok">
                <span aria-hidden>🎵</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} Orus School. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;
