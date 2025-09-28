import React from "react";
import { Link, usePage } from "@inertiajs/react";

// util: cocokkan route current
const isActive = (url, current) =>
  current === url || (current.startsWith(url) && url !== "/");

export default function NavItem({ href, icon = null, children }) {
  const { url } = usePage(); // current path, ex: /admin/penilaian/bobot
  const active = isActive(href, url);

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      {icon ? <span className="w-4 h-4">{icon}</span> : null}
      <span>{children}</span>
    </Link>
  );
}
