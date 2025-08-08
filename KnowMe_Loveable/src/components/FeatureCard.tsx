import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  accent: "indigo" | "emerald" | "orange";
  children?: ReactNode;
  className?: string;
}

const accentColors = {
  indigo: "border-l-primary-indigo",
  emerald: "border-l-emerald-green", 
  orange: "border-l-warm-orange"
};

export const FeatureCard = ({ title, description, accent, children, className }: FeatureCardProps) => {
  return (
    <div className={cn(
      "bg-content-background rounded-lg p-6 border border-border-light border-l-4 hover:shadow-card transition-all duration-200",
      accentColors[accent],
      className
    )}>
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-muted text-sm mb-4">{description}</p>
      {children && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

interface ChipButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ChipButton = ({ children, onClick, className }: ChipButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-muted text-text-muted px-3 py-2 rounded-lg text-sm hover:bg-border-light transition-colors duration-200",
        className
      )}
    >
      {children}
    </button>
  );
};