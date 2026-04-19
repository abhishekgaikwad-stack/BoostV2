export function SiteFooter() {
  return (
    <footer className="w-full bg-black py-14 text-brand-text-secondary-dark">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center">
        <span className="font-display text-[16px] font-medium text-brand-text-primary-dark">
          boost
        </span>
        <span className="font-display text-[12px] font-medium">
          © {new Date().getFullYear()} Boost. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
