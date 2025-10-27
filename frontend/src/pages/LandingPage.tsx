import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectionTitle from "../components/SectionTitle";
import HighlightCard from "../components/HighlightCard";
import DifferentiatorCard from "../components/DifferentiatorCard";
import CTAButtons from "../components/CTAButtons";
import TestimonialCard from "../components/TestimonialCard";
import { highlights, differentiators, curriculum, testimonials } from "../data/highlights";
import { courseCatalog } from "../data/courseDetails";

const courses = Object.values(courseCatalog);
const defaultActiveCourseSlug =
  courses.find((course) => course.lessons.some((lesson) => lesson.status !== "completed"))?.slug ??
  courses[0]?.slug ??
  "c-foundations";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-midnight via-[#080c1a] to-black text-gray-200">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_55%)]" />
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex rounded-full border border-electric/40 bg-electric/10 px-4 py-1 text-sm font-medium text-electric-light"
              >
                Master the craft of building software
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="mt-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl"
              >
                Learn to think, code, and build like a software engineer.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-6 text-lg text-gray-300"
              >
                Orus School combines immersive lessons, a live coding playground, and a progress system inspired by the best
                engineering academies.
              </motion.p>
              <CTAButtons
                primaryLabel="Start Learning"
                primaryTo="/register"
                authenticatedTo={`/course/${defaultActiveCourseSlug}`}
                secondaryLabel="Explore Curriculum"
                secondaryHref="#curriculum"
              />
              <div className="mt-10 grid grid-cols-1 gap-4 text-sm text-gray-400 sm:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold text-white">+120</p>
                  <p>Interactive challenges</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">24/7</p>
                  <p>Playground access</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">10</p>
                  <p>Capstone projects</p>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-electric/40 to-electric-light/40 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 shadow-2xl shadow-electric/10">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Live Playground</span>
                  <span>Auto-save enabled</span>
                </div>
                <div className="mt-6 space-y-4 rounded-xl bg-[#0f172a] p-6 font-mono text-xs">
                  <p className="text-electric-light">$ gcc main.c && ./a.out</p>
                  <p>Welcome to Orus School 👋</p>
                  <p className="text-emerald-400">All tests passed.</p>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                    <p className="text-gray-400">Progress</p>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-electric to-electric-light" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="learn" className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <SectionTitle
              eyebrow="What you’ll learn"
              title="Core pillars for your first year"
              description="A curriculum that grounds you in systems thinking while sharpening your problem-solving muscles."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {highlights.map((item) => (
                <HighlightCard key={item.title} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <SectionTitle
              eyebrow="Why Orus"
              title="A different kind of coding school"
              description="Every layer of the platform is crafted to simulate professional workflows with the safety of a learning environment."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {differentiators.map((item) => (
                <DifferentiatorCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </section>

        <section id="curriculum" className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-10">
            <SectionTitle
              eyebrow="Year 1 Roadmap"
              title="Your learning journey"
              description="Structured tracks ensure you progressively layer knowledge, culminating in a final project you’ll be proud to ship."
            />
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4">
                {curriculum.map((item) => (
                  <div key={item} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-electric/20 text-sm font-semibold text-electric">
                      •
                    </span>
                    <p className="text-sm text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-electric/30 bg-electric/10 p-8">
                <h3 className="text-2xl font-semibold text-white">How it works</h3>
                <ol className="mt-6 space-y-4 text-sm text-gray-200">
                  <li>
                    <span className="font-semibold text-electric-light">1.</span> Start with immersive video lessons and in-depth
                    reading notes.
                  </li>
                  <li>
                    <span className="font-semibold text-electric-light">2.</span> Practice in the live playground with real auto-graded
                    tests.
                  </li>
                  <li>
                    <span className="font-semibold text-electric-light">3.</span> Unlock achievements and mentor feedback to stay on
                    track.
                  </li>
                </ol>
                <CTAButtons
                  primaryLabel="Create your account"
                  primaryTo="/register"
                  secondaryLabel="Talk to the team"
                  secondaryHref="mailto:hello@orus.school"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-12">
            <SectionTitle
              align="center"
              eyebrow="Student Stories"
              title="Trusted by learners leveling up their craft"
              description="Hear how Orus School empowers students to grow from fundamentals to advanced engineering challenges."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={testimonial.name} index={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        <section id="apply" className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-electric/40 bg-gradient-to-br from-electric/20 via-electric/10 to-transparent p-10 text-center">
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to join Orus School?</h2>
            <p className="mt-4 text-base text-gray-300">
              Secure your spot in our next cohort and start building with a community that cares about real-world skills.
            </p>
            <CTAButtons primaryLabel="Get Started" primaryTo="/register" secondaryLabel="Contact Us" secondaryHref="#contact" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
