import {
  HeadphonesIcon,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  Zap,
} from "lucide-react";
import { features, stats } from "@/lib/mock";

const featureIcons = [LockKeyhole, Zap, HeadphonesIcon, ShieldCheck, UserCheck];

export function StatsSection() {
  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-black p-8">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:divide-x lg:divide-[#353535]">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <span className="font-display text-[28px] font-bold leading-8 text-brand-text-primary-dark">
              {stat.value}
            </span>
            <span className="font-display text-[12px] font-normal leading-4 text-brand-text-secondary-dark">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-brand-border-subtle pt-6 sm:grid-cols-2 lg:grid-cols-5">
        {features.map((feature, i) => {
          const Icon = featureIcons[i] ?? ShieldCheck;
          return (
            <div
              key={feature.title}
              className="flex items-center gap-3"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-bg-elevated text-brand-accent">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-[13px] font-medium leading-4 text-brand-text-primary-dark">
                  {feature.title}
                </span>
                <span className="font-mono text-[10px] tracking-[0.05em] text-brand-text-secondary-dark">
                  {feature.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
