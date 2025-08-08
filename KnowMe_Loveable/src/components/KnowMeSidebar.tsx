import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export const Sidebar = ({ children, className }: SidebarProps) => {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full w-64 bg-sidebar-background flex flex-col gap-4 p-6 border-r border-border-light",
      className
    )}>
      {children}
    </aside>
  );
};

interface SidebarItemProps {
  children: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: number;
}

export const SidebarItem = ({ children, isActive, onClick, className, badge }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full p-3 rounded-lg text-left transition-all duration-200",
        isActive 
          ? "bg-primary-indigo text-white" 
          : "text-text-primary hover:bg-primary-indigo hover:bg-opacity-10",
        className
      )}
    >
      <span className="flex items-center gap-3">
        {children}
      </span>
      {badge && badge > 0 && (
        <span className="bg-error-red text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
};

export const SidebarLogo = ({ children }: { children: ReactNode }) => {
  return (
    <div className="text-primary-indigo font-bold text-xl mb-4">
      {children}
    </div>
  );
};

export const SidebarBottom = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mt-auto">
      {children}
    </div>
  );
};