import React from "react";

export const NavbarSection = ({
  logo = "ShopLogo",
  links = [
    { label: "Home", href: "#" },
    { label: "Products", href: "#products" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
}: {
  logo?: string;
  links?: { label: string; href: string }[];
}) => (
  <nav className="w-full flex items-center justify-between py-4 px-8 bg-white shadow rounded-2xl">
    <div className="font-bold text-2xl text-brand-primary">{logo}</div>
    <ul className="flex gap-8 text-brand-dark font-medium">
      {links.map((link, idx) => (
        <li key={idx}>
          <a href={link.href} className="hover:text-brand-primary transition">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

NavbarSection.craft = {
  displayName: "NavbarSection",
};
