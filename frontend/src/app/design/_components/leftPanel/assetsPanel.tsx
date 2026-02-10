import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_assets/Container/Container";
import { Text } from "../../_assets/Text/Text";
import { Image } from "../../_assets/Image/Image";
import { Button } from "../../_assets/Button/Button";
import { Divider } from "../../_assets/Divider/Divider";
import { Section } from "../../_assets/Section/Section";
import { Row } from "../../_assets/Row/Row";
import { Column } from "../../_assets/Column/Column";

interface TemplateEntry {
  label: string;
  description: string;
  preview: string;
  element: React.ReactElement;
  category: "header" | "hero" | "content" | "footer" | "form" | "card";
}

const TEMPLATES: TemplateEntry[] = [
  // ─── Headers ───────────────────────────────────────
  {
    label: "Simple Header",
    description: "Clean navbar with logo and menu",
    preview: "Nav",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#ffffff"
          padding={20}
          canvas
        >
          <Element
            is={Row as any}
            canvas
          >
            <Element is={Column as any} canvas>
              <Text text="Logo" fontSize={24} fontWeight="bold" color="#3b82f6" />
            </Element>
            <Element is={Column as any} canvas>
              <Element is={Row as any} canvas>
                <Text text="Home" fontSize={16} color="#64748b" />
                <Text text="About" fontSize={16} color="#64748b" />
                <Text text="Services" fontSize={16} color="#64748b" />
                <Text text="Contact" fontSize={16} color="#64748b" />
              </Element>
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "header",
  },
  {
    label: "Header with CTA",
    description: "Navigation with call-to-action button",
    preview: "Nav+Btn",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#1e293b"
          padding={20}
          canvas
        >
          <Element
            is={Row as any}
            canvas
          >
            <Element is={Column as any} canvas>
              <Text text="BrandName" fontSize={24} fontWeight="bold" color="#ffffff" />
            </Element>
            <Element is={Column as any} canvas>
              <Element is={Row as any} canvas>
                <Text text="Home" fontSize={16} color="#e2e8f0" />
                <Text text="Features" fontSize={16} color="#e2e8f0" />
                <Text text="Pricing" fontSize={16} color="#e2e8f0" />
                <Button backgroundColor="#3b82f6" textColor="#ffffff" fontSize={14} label="Get Started" />
              </Element>
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "header",
  },
  // ─── Hero Sections ─────────────────────────────────
  {
    label: "Centered Hero",
    description: "Hero section with centered content",
    preview: "Hero",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#f8fafc"
          padding={80}
          maxWidth="800px"
          canvas
        >
          <Element is={Column as any} canvas>
            <Text 
              text="Welcome to Our Platform" 
              fontSize={48} 
              fontWeight="bold" 
              color="#1e293b" 
            />
            <Text 
              text="Build amazing websites with our drag-and-drop editor. No coding required." 
              fontSize={18} 
              color="#64748b" 
            />
            <Element is={Row as any} canvas>
              <Button label="Get Started" backgroundColor="#3b82f6" textColor="#ffffff" fontSize={16} />
              <Button label="Learn More" backgroundColor="#ffffff" textColor="#64748b" fontSize={16} />
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "hero",
  },
  {
    label: "Hero with Image",
    description: "Hero with text and image placeholder",
    preview: "📷 Hero",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#ffffff"
          padding={60}
          canvas
        >
          <Element is={Row as any} canvas>
            <Element is={Column as any} canvas>
              <Text 
                text="Create Beautiful Websites" 
                fontSize={40} 
                fontWeight="bold" 
                color="#1e293b" 
              />
              <Text 
                text="Our visual builder makes it easy to create stunning websites without writing a single line of code." 
                fontSize={16} 
                color="#64748b" 
              />
              <Button label="Start Building" backgroundColor="#10b981" textColor="#ffffff" fontSize={16} />
            </Element>
            <Element is={Column as any} canvas>
              <Element 
                is={Container as any}
                background="linear-gradient(135deg, #a5b4fc, #818cf8)"
                height={300}
                canvas
              >
                <Text text="Image Placeholder" fontSize={18} color="#ffffff" />
              </Element>
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "hero",
  },
  // ─── Content Sections ──────────────────────────────
  {
    label: "Features Grid",
    description: "3-column features section",
    preview: "📊",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#ffffff"
          padding={80}
          canvas
        >
          <Element is={Column as any} canvas>
            <Text 
              text="Why Choose Us" 
              fontSize={36} 
              fontWeight="bold" 
              color="#1e293b" 
            />
            <Text 
              text="Discover the features that make us stand out" 
              fontSize={18} 
              color="#64748b" 
            />
          </Element>
          <Element is={Row as any} canvas>
            {[1, 2, 3].map((num) => (
              <Element is={Column as any} key={num} canvas>
                <Element 
                  is={Container as any}
                  background="#f8fafc"
                  padding={24}
                  canvas
                >
                  <Text text={`Feature ${num}`} fontSize={20} fontWeight="600" color="#1e293b" />
                  <Text 
                    text="Lorem ipsum dolor sit amet, consectetur adipiscing elit." 
                    fontSize={14} 
                    color="#64748b" 
                  />
                </Element>
              </Element>
            ))}
          </Element>
        </Element>
      </Element>
    ),
    category: "content",
  },
  {
    label: "Testimonial",
    description: "Customer testimonial with quote",
    preview: "💬",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#f1f5f9"
          padding={60}
          maxWidth="800px"
          canvas
        >
          <Element is={Column as any} canvas>
            <Text 
              text='"Excellent service and support. Highly recommended!"' 
              fontSize={24} 
              color="#475569" 
            />
            <Element is={Row as any} canvas>
              <Element 
                is={Container as any}
                background="#3b82f6"
                width={50}
                height={50}
                canvas
              >
                <Text text="JD" fontSize={16} color="#ffffff" />
              </Element>
              <Element is={Column as any} canvas>
                <Text text="John Doe" fontSize={18} fontWeight="600" color="#1e293b" />
                <Text text="CEO, Company Name" fontSize={14} color="#64748b" />
              </Element>
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "content",
  },
  // ─── Forms ─────────────────────────────────────────
  {
    label: "Contact Form",
    description: "Simple contact form with fields",
    preview: "📝",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#ffffff"
          padding={60}
          maxWidth="600px"
          canvas
        >
          <Element is={Column as any} canvas>
            <Text 
              text="Get In Touch" 
              fontSize={32} 
              fontWeight="bold" 
              color="#1e293b" 
            />
            <Text 
              text="Fill out the form below and we'll get back to you soon" 
              fontSize={16} 
              color="#64748b" 
            />
            <Element is={Column as any} canvas>
              <Element is={Row as any} canvas>
                <Element is={Column as any} canvas>
                  <Text text="Name" fontSize={14} fontWeight="500" color="#475569" />
                  <Element 
                    is={Container as any}
                    background="#f8fafc"
                    padding={12}
                    canvas
                  >
                    <Text text="Your name" fontSize={14} color="#94a3b8" />
                  </Element>
                </Element>
                <Element is={Column as any} canvas>
                  <Text text="Email" fontSize={14} fontWeight="500" color="#475569" />
                  <Element 
                    is={Container as any}
                    background="#f8fafc"
                    padding={12}
                    canvas
                  >
                    <Text text="your@email.com" fontSize={14} color="#94a3b8" />
                  </Element>
                </Element>
              </Element>
              <Element is={Column as any} canvas>
                <Text text="Message" fontSize={14} fontWeight="500" color="#475569" />
                <Element 
                  is={Container as any}
                  background="#f8fafc"
                  padding={12}
                  height={120}
                  canvas
                >
                  <Text text="Your message here..." fontSize={14} color="#94a3b8" />
                </Element>
              </Element>
              <Button 
                label="Send Message" 
                backgroundColor="#3b82f6" 
                textColor="#ffffff" 
                fontSize={16}
              />
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "form",
  },
  {
    label: "Newsletter Signup",
    description: "Email subscription form",
    preview: "✉️",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#f8fafc"
          padding={60}
          maxWidth="600px"
          canvas
        >
          <Element is={Column as any} canvas>
            <Text 
              text="Subscribe to Our Newsletter" 
              fontSize={32} 
              fontWeight="bold" 
              color="#1e293b" 
            />
            <Text 
              text="Get the latest updates and news delivered to your inbox" 
              fontSize={16} 
              color="#64748b" 
            />
            <Element is={Row as any} canvas>
              <Element 
                is={Container as any}
                background="#ffffff"
                padding={12}
                canvas
              >
                <Text text="Enter your email" fontSize={14} color="#94a3b8" />
              </Element>
              <Button label="Subscribe" backgroundColor="#3b82f6" textColor="#ffffff" fontSize={16} />
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "form",
  },
  // ─── Footers ───────────────────────────────────────
  {
    label: "Simple Footer",
    description: "Basic footer with copyright",
    preview: "Footer",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#1e293b"
          padding={40}
          canvas
        >
          <Element is={Row as any} canvas>
            <Element is={Column as any} canvas>
              <Text text="© 2024 Company Name. All rights reserved." fontSize={14} color="#94a3b8" />
            </Element>
            <Element is={Column as any} canvas>
              <Element is={Row as any} canvas>
                <Text text="Privacy Policy" fontSize={14} color="#cbd5e1" />
                <Text text="Terms of Service" fontSize={14} color="#cbd5e1" />
                <Text text="Contact" fontSize={14} color="#cbd5e1" />
              </Element>
            </Element>
          </Element>
        </Element>
      </Element>
    ),
    category: "footer",
  },
  {
    label: "Multi-column Footer",
    description: "Footer with multiple link columns",
    preview: "📋 Footer",
    element: (
      <Element is={Section as any} canvas>
        <Element
          is={Container as any}
          background="#0f172a"
          padding={60}
          canvas
        >
          <Element is={Row as any} canvas>
            <Element is={Column as any} canvas>
              <Text text="BrandName" fontSize={24} fontWeight="bold" color="#ffffff" />
              <Text text="Building the future of web development." fontSize={14} color="#cbd5e1" />
            </Element>
            <Element is={Column as any} canvas>
              <Text text="Quick Links" fontSize={16} fontWeight="600" color="#ffffff" />
              <Element is={Column as any} canvas>
                <Text text="Home" fontSize={14} color="#cbd5e1" />
                <Text text="About" fontSize={14} color="#cbd5e1" />
                <Text text="Services" fontSize={14} color="#cbd5e1" />
                <Text text="Contact" fontSize={14} color="#cbd5e1" />
              </Element>
            </Element>
            <Element is={Column as any} canvas>
              <Text text="Contact Us" fontSize={16} fontWeight="600" color="#ffffff" />
              <Element is={Column as any} canvas>
                <Text text="hello@example.com" fontSize={14} color="#cbd5e1" />
                <Text text="+1 234 567 890" fontSize={14} color="#cbd5e1" />
              </Element>
            </Element>
          </Element>
          <Divider />
          <Text 
            text="© 2024 BrandName. All rights reserved." 
            fontSize={14} 
            color="#94a3b8" 
          />
        </Element>
      </Element>
    ),
    category: "footer",
  },
  // ─── Cards ─────────────────────────────────────────
  {
    label: "Product Card",
    description: "E-commerce product card",
    preview: "🛍️",
    element: (
      <Element
        is={Container as any}
        background="#ffffff"
        padding={20}
        maxWidth="300px"
        canvas
      >
        <Element 
          is={Container as any}
          background="linear-gradient(45deg, #6ee7b7, #3b82f6)"
          height={180}
          canvas
        >
          <Text text="Product Image" fontSize={14} color="#ffffff" />
        </Element>
        <Text text="Product Name" fontSize={18} fontWeight="600" color="#1e293b" />
        <Text text="$99.99" fontSize={20} fontWeight="bold" color="#3b82f6" />
        <Text text="Short description of the product." fontSize={14} color="#64748b" />
        <Button label="Add to Cart" backgroundColor="#10b981" textColor="#ffffff" fontSize={14} />
      </Element>
    ),
    category: "card",
  },
  {
    label: "Team Member Card",
    description: "Profile card for team members",
    preview: "👥",
    element: (
      <Element
        is={Container as any}
        background="#ffffff"
        padding={24}
        maxWidth="280px"
        canvas
      >
        <Element 
          is={Container as any}
          background="#3b82f6"
          width={80}
          height={80}
          canvas
        >
          <Text text="JD" fontSize={24} color="#ffffff" />
        </Element>
        <Text text="John Doe" fontSize={20} fontWeight="bold" color="#1e293b" />
        <Text text="Web Developer" fontSize={14} color="#64748b" />
        <Text text="Passionate about creating beautiful websites." fontSize={13} color="#94a3b8" />
      </Element>
    ),
    category: "card",
  },
];

const CATEGORY_LABELS: Record<TemplateEntry["category"], string> = {
  header: "Headers",
  hero: "Hero Sections",
  content: "Content Sections",
  footer: "Footers",
  form: "Forms",
  card: "Cards",
};

const CATEGORY_ORDER: TemplateEntry["category"][] = ["header", "hero", "content", "form", "card", "footer"];

export const AssetsPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-light mb-1">Built-in Templates</h3>
        <p className="text-xs text-brand-medium">
          Drag and drop ready-to-use templates
        </p>
      </div>
      
      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((category) => {
          const templates = TEMPLATES.filter((t) => t.category === category);
          if (templates.length === 0) return null;

          return (
            <div key={category} className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-brand-medium uppercase tracking-wider px-1">
                {CATEGORY_LABELS[category]}
              </span>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.label}
                    ref={(ref) => {
                      if (ref) connectors.create(ref, template.element);
                    }}
                    className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-brand-light">
                          {template.label}
                        </h4>
                        <p className="text-xs text-brand-medium mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="h-10 w-10 bg-brand-medium/20 rounded-lg flex items-center justify-center text-sm">
                        {template.preview}
                      </div>
                    </div>
                    <div className="text-[10px] text-brand-medium font-medium mt-2 px-2 py-1 bg-brand-medium/10 rounded inline-block">
                      {CATEGORY_LABELS[category]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-brand-medium/20">
        <div className="text-xs text-brand-medium">
          <p className="font-medium text-brand-light mb-1">How to use:</p>
          <p>Drag any template to the canvas. All elements can be customized after dropping.</p>
        </div>
      </div>
    </div>
  );
};