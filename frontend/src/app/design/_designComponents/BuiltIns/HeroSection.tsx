import React from "react";

export const HeroSection = ({
  title = "Welcome to Our Store!",
  subtitle = "Discover amazing products and deals.",
  background = "#f5f5fa",
  image = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  ctaText = "Shop Now",
  onCtaClick = () => {},
}: {
  title?: string;
  subtitle?: string;
  background?: string;
  image?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}) => (
  <section
    className="w-full flex flex-col md:flex-row items-center justify-between p-12 rounded-3xl shadow-lg"
    style={{ background }}
  >
    <div className="flex-1 pr-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-brand-dark">{title}</h1>
      <p className="text-lg md:text-xl mb-8 text-brand-medium">{subtitle}</p>
      <button
        className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold shadow hover:bg-brand-dark transition"
        onClick={onCtaClick}
      >
        {ctaText}
      </button>
    </div>
    <div className="flex-1 flex justify-center">
      <img src={image} alt="Hero" className="rounded-2xl max-h-96 object-cover" />
    </div>
  </section>
);

HeroSection.craft = {
  displayName: "HeroSection",
};
