
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ title, value, unit, icon: Icon, className, children, variant = 'default' }: StatCardProps) {
  const cardBgClass = 
    variant === 'primary' ? 'bg-primary/10 border-primary/30' :
    variant === 'accent' ? 'bg-accent/10 border-accent/30' :
    '';
  
  const titleColorClass = 
    variant === 'primary' ? 'text-primary' :
    variant === 'accent' ? 'text-accent-foreground' : // Using accent-foreground for title on accent bg
    '';

  return (
    <Card className={cn("shadow-lg transition-all hover:shadow-xl", cardBgClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", titleColorClass)}>{title}</CardTitle>
        {Icon && <Icon className={cn("h-5 w-5 text-muted-foreground", titleColorClass)} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
