const Footer = () => {
  return (
    <footer id="contact" className="border-t border-editor-border bg-editor-panel/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-semibold text-white">Orus School</p>
          <p className="text-sm text-gray-400">
            A modern coding academy blending mastery of fundamentals with project-based learning.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-gray-400 sm:items-end">
          <a href="mailto:hello@orus.school" className="hover:text-white">
            hello@orus.school
          </a>
          <p>Marseille, France</p>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Orus School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
