# Landing Page Concept — Orus School Coding Academy

## 1. Purpose
* Present Orus School as the premier modern coding academy in Congo-Brazzaville.
* Drive applications for the two-year software engineering program.
* Build trust with parents, sponsors, and prospective students through a polished and inspirational design.

## 2. Brand & Visual Direction
* **Primary Color:** Deep Blue `#1E3A8A`
* **Secondary Color:** Bright Green `#10B981`
* **Accent Colors:** Slate Gray `#1F2937`, Light Gray `#F3F4F6`, White `#FFFFFF`
* **Typography:** Use Google Fonts — headings in `Poppins` or `Montserrat`, body text in `Inter`.
* **Imagery:** Use high-quality photos of African students learning, code-related illustrations, or abstract tech patterns.
* **Iconography:** Fluent UI or Heroicons line icons.
* **Overall Feel:** Modern, minimalist, with bold typography and plenty of white space.

## 3. Layout & Navigation
* **Navigation bar:**
  * Logo on the left (Orus School).
  * Menu items (anchor links): About, Program, Experience, Pricing, Apply.
  * Secondary button `Apply Now` on the right (desktop only).
* **Responsive behavior:**
  * Desktop — horizontal menu, sticky on scroll with subtle shadow.
  * Mobile — hamburger menu that expands to a full-screen overlay.

## 4. Section Breakdown

### 4.1 Hero Section
* **Background:** Full-width gradient (Deep Blue → Midnight Purple) or overlay on a coding classroom photo.
* **Content alignment:** Centered vertically, left-aligned text.
* **Heading:** "Become a Software Engineer in 2 Years" (text-shadow or gradient text optional).
* **Subheading:** "A modern coding school in Congo-Brazzaville. Learn by building real projects, guided by mentors."
* **Buttons:**
  * Primary `Apply Now` — solid green, hover darkens slightly.
  * Secondary `Learn More` — ghost button with blue border; smooth scroll to curriculum.
* **Hero stats:** Small badges under buttons (e.g., "10 students per cohort", "100% project-based").

### 4.2 About / Vision
* **Layout:** Two columns (reverse on mobile), 60/40 text-to-image ratio.
* **Content:**
  * Subtitle: "Our Vision"
  * Body copy describing mission, focus on real-world skills, and commitment to Congo-Brazzaville.
  * List with check icons for project-based learning, small classes, job readiness.
* **Image:** Photo or illustration with rounded corners and subtle shadow.

### 4.3 Program Overview
* **Component:** Two-card timeline representing Year 1 and Year 2.
* **Year 1 (Foundations):**
  * Modules: C programming, Unix mastery, Algorithms, Networking.
  * Capstone: Build a web server or multiplayer game.
  * Icon suggestions: 💻, ⚙️, 🌐, 🎮.
* **Year 2 (Advanced & Specializations):**
  * Tracks: AI, Cybersecurity, Web development, Graphics.
  * Final Capstone integrating chosen specialization.
  * Icons: 🤖, 🔒, 🌍, ✨.
* **Layout:** Cards connected by a vertical line on mobile, horizontal timeline on desktop.

### 4.4 Features / Why Choose Us
* **Layout:** Grid of four cards.
* **Cards:**
  * 👨‍🏫 Mentorship — "Learn guided by engineers with industry experience."
  * 📂 Portfolio — "Graduate with 10+ real projects on GitHub."
  * 🌍 Job Ready — "Master the tools local and global companies demand."
  * 🎯 Small Classes — "Cohorts of 10 ensure personalized feedback."
* **Interactions:** Hover elevation and color accent border.

### 4.5 Student Experience
* **Layout:** Carousel or responsive grid of three highlights.
* **Highlights:**
  * Dashboard with progress tracking and XP.
  * Project submission & review system.
  * Gamified learning path with badges.
* **Assets:** Use mock screenshots or placeholders framed in device mockups.

### 4.6 Testimonials
* **Design:** Cards with rounded corners, student avatars, name, and quote.
* **Sample quote:** "I built my first web server in 3 months — never thought I could do this!"
* **Optional:** Add carousel dots for multiple testimonials.

### 4.7 Call-to-Action Banner
* **Background:** Solid green (#10B981) with white text.
* **Message:** "Limited seats: Only 10 students per cohort."
* **Button:** `Apply Now` — white background with blue text.
* **Placement:** Before pricing section.

### 4.8 Pricing / Enrollment Info
* **Card layout:** Centered column with border and drop shadow.
* **Content:**
  * Tuition: "15,000–25,000 FCFA per month"
  * Duration: "2-year immersive program"
  * Payment plans: "Monthly or annual options"
* **Button:** `Register Interest` — blue background, green hover.

### 4.9 Footer
* **Columns:**
  * Left: Logo + "Empowering Congo’s next generation of software engineers."
  * Middle: Quick links to sections.
  * Right: Contact info (email, phone, Brazzaville address) and social icons (Facebook, LinkedIn, TikTok).
* **Footer background:** Dark blue with white text.

## 5. Interactions & Motion
* Smooth scroll for anchor links.
* Fade-in or slide-up animations on section entry (use Framer Motion or CSS animations).
* Button hover states with scale (1.02) and shadow transitions.
* Testimonials carousel auto-advances with pause on hover.

## 6. Responsive Behavior
* **Mobile:** Stack sections vertically, hero text centered, convert timeline to accordion.
* **Tablet:** Two-column layouts maintained with image scaling.
* **Desktop:** Full grid experience, hero height ~80vh.
* Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

## 7. Content Requirements
* Update copy to highlight Congo-Brazzaville context and outcomes.
* Include real or stock photos of African students in tech environments.
* Provide translation toggle (future enhancement) — placeholder icon in navigation.

## 8. Implementation Notes
* Built with React + Tailwind CSS (project already configured).
* Create reusable components: `Section`, `Button`, `Card`, `Timeline`, `TestimonialCarousel`.
* Use data-driven approach: store section content in JSON/TS arrays for easy updates.
* Optimize for performance — compress images, lazy-load testimonials and experience assets.

## 9. KPIs & Conversion Goals
* Primary: Click-through on `Apply Now` buttons.
* Secondary: `Register Interest` submissions.
* Track with Google Analytics or plausible.io.

## 10. Next Steps
1. Gather visual assets (photos, icons, platform mockups).
2. Create wireframes for desktop and mobile views.
3. Implement responsive layout using Tailwind components.
4. Integrate application form or link to admissions portal.
