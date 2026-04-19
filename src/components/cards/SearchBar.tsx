import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar({
  className,
  onOpen,
}: {
  className?: string;
  onOpen?: () => void;
}) {
  return (
    <form
      role="search"
      onClick={onOpen}
      onFocusCapture={onOpen}
      className={cn(
        "flex h-16 w-full items-stretch gap-2 rounded-2xl bg-brand-bg-pill p-0",
        className,
      )}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-2xl bg-black px-6 font-display text-[16px] font-medium text-white"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
        Menu
      </button>
      <input
        type="text"
        placeholder="Search by Game"
        className="flex-1 bg-transparent px-4 font-display text-[16px] font-medium text-brand-text-primary-light placeholder:text-brand-text-tertiary-dark focus:outline-none"
      />
    </form>
  );
}
