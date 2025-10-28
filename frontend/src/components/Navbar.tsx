import { Fragment } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const links = [
  { name: "Home", to: "/landing" },
  { name: "Curriculum", to: "#curriculum" },
  { name: "Features", to: "#features" },
  { name: "Contact", to: "#contact" },
];

const Navbar = () => {
  const location = useLocation();
  const { student } = useAuth();
  const isLoggedIn = Boolean(student);
  const firstName = student?.fullName.split(" ")[0] ?? "Profile";

  return (
    <Disclosure as="nav" className="bg-editor-panel/90 backdrop-blur border-b border-white/10 sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/landing" className="text-xl font-semibold tracking-tight">
                  <span className="text-electric">Orus</span> School
                </Link>
                <span className="hidden md:inline-flex rounded-full bg-electric/10 px-3 py-1 text-xs text-electric-light">
                  Learn → Practice → Grow
                </span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                {links.map((link) => (
                  <a key={link.name} href={link.to} className="text-sm text-gray-300 hover:text-white transition">
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="hidden md:flex items-center gap-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/admin"
                      className="rounded-full border border-electric/40 px-4 py-2 text-sm text-electric-light hover:border-electric hover:text-electric"
                    >
                      Admin
                    </Link>
                    <Link
                      to="/profile"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 hover:border-electric-light hover:text-white"
                    >
                      {firstName}’s Space
                    </Link>
                    <Link
                      to="/logout"
                      className="rounded-full bg-electric px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/20 hover:bg-electric-light"
                    >
                      Logout
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 hover:border-electric-light hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-full bg-electric px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/20 hover:bg-electric-light"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
              <div className="flex md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-electric">
                  <span className="sr-only">Open main menu</span>
                  {open ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Disclosure.Panel className="md:hidden border-t border-white/10 bg-editor-panel/80">
              <div className="space-y-1 px-4 pb-3 pt-2">
                {links.map((link) => (
                  <Disclosure.Button
                    key={link.name}
                    as="a"
                    href={link.to}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/10",
                      location.pathname === link.to && "bg-electric/20 text-white"
                    )}
                  >
                    {link.name}
                  </Disclosure.Button>
                ))}
                {isLoggedIn ? (
                  <>
                    <Disclosure.Button
                      as={Link}
                      to="/admin"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/10"
                    >
                      Admin
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/10"
                    >
                      {firstName}’s Space
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/logout"
                      className="block rounded-md bg-electric px-3 py-2 text-base font-semibold text-white hover:bg-electric-light"
                    >
                      Logout
                    </Disclosure.Button>
                  </>
                ) : (
                  <>
                    <Disclosure.Button
                      as={Link}
                      to="/login"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-200 hover:bg-white/10"
                    >
                      Sign In
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      to="/register"
                      className="block rounded-md bg-electric px-3 py-2 text-base font-semibold text-white hover:bg-electric-light"
                    >
                      Get Started
                    </Disclosure.Button>
                  </>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

export default Navbar;
