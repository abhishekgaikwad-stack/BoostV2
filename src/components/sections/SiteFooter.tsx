import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { LocaleButton } from "@/components/sections/LocaleButton";
import { assetUrl, paymentIcon } from "@/lib/images";

// Static config for the link sitemap and payment pills. Hrefs are
// placeholders ("#") for items that don't have routes yet — replace
// per item as the corresponding pages land.
const LINK_COLUMNS: Array<{
  title: string;
  items: Array<{ label: string; href: string }>;
}> = [
  {
    title: "boost",
    items: [
      { label: "How it works", href: "#" },
      { label: "Buyer protection", href: "#" },
      { label: "Refund policy", href: "#" },
      { label: "Payment methods", href: "#" },
      { label: "Help center", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "FAQs", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Affiliate program", href: "#" },
    ],
  },
  {
    title: "Steam",
    items: [
      { label: "Games", href: "#" },
      { label: "Gift cards", href: "#" },
      { label: "DLCs", href: "#" },
      { label: "Game Points", href: "#" },
      { label: "Best Sellers", href: "#" },
    ],
  },
  {
    title: "Playstation",
    items: [
      { label: "About us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "FAQs", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Genres", href: "#" },
    ],
  },
  {
    title: "Xbox",
    items: [
      { label: "About us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "FAQs", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Genres", href: "#" },
    ],
  },
];

const SOCIALS: Array<{ label: string; icon: string; href: string }> = [
  { label: "Twitter", icon: "hugeicons:new-twitter", href: "#" },
  { label: "Instagram", icon: "hugeicons:instagram", href: "#" },
  { label: "Facebook", icon: "hugeicons:facebook-02", href: "#" },
  { label: "YouTube", icon: "hugeicons:youtube", href: "#" },
  { label: "Twitch", icon: "hugeicons:twitch", href: "#" },
];

const PAYMENT_METHODS: Array<{ slug: string; label: string }> = [
  { slug: "apple-pay", label: "Apple Pay" },
  { slug: "google-pay", label: "Google Pay" },
  { slug: "visa", label: "Visa" },
  { slug: "mastercard", label: "Mastercard" },
  { slug: "paypal", label: "PayPal" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-black px-12 pt-8 pb-6 text-white">
      <div className="mx-auto flex max-w-[1632px] flex-col gap-12">
        {/* Top: brand block + sitemap columns */}
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="flex shrink-0 flex-col items-center gap-6 lg:w-[148px]">
            <Link href="/" className="flex flex-col items-center gap-3" aria-label="Boost home">
              <span className="relative grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-[20px] bg-gradient-to-b from-brand-accent to-brand-accent-dark">
                <Image
                  src={assetUrl("boost-logo-icon.svg")}
                  alt="Boost"
                  fill
                  sizes="72px"
                  className="object-contain"
                />
              </span>
              <span className="font-display text-[16px] font-medium leading-5 text-white">
                boost
              </span>
            </Link>
            <ul className="flex items-center gap-3">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <Link
                    href={social.href}
                    aria-label={social.label}
                    className="grid h-5 w-5 place-items-center text-white transition hover:text-brand-accent"
                  >
                    <Icon icon={social.icon} className="h-5 w-5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {LINK_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h3 className="font-display text-[14px] font-medium leading-[18px] text-white">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: help · copyright · locale + payments. Grid keeps the
            copyright centered in the row on lg+. */}
        <div className="grid items-center gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <span className="font-display text-[12px] font-medium leading-4 text-white">
              Need help?
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1a1a1a] px-3 font-display text-[10px] font-medium uppercase tracking-[0.05em] text-white transition hover:bg-brand-bg-elevated"
              >
                <Icon icon="hugeicons:bubble-chat" className="h-5 w-5" />
                Chat with us
              </button>
              <span className="font-display text-[12px] font-medium leading-4 text-brand-text-secondary-dark">
                We are here to help 24/7
              </span>
            </div>
          </div>

          <p className="text-center font-display text-[12px] font-normal leading-3 text-brand-text-secondary-dark">
            Copyright © {year} Boost - All rights reserved
          </p>

          <div className="flex flex-col items-center gap-2 lg:items-end">
            <LocaleButton
              label="English, Euro (€)"
              className="font-display text-[12px] font-medium leading-4 text-white transition hover:text-brand-accent"
            />
            <ul className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              {PAYMENT_METHODS.map((method) => (
                <li
                  key={method.slug}
                  className="relative grid h-8 w-16 place-items-center overflow-hidden rounded-lg border border-brand-border-subtle bg-[#1a1a1a]"
                >
                  <Image
                    src={paymentIcon(method.slug)}
                    alt={method.label}
                    width={40}
                    height={20}
                    className="h-5 w-10 object-contain"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
