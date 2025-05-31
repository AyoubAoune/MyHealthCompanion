
"use client";

import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { IntakeProgressCard } from "@/components/app/my-health-companion/IntakeProgressCard";
import { WeeklyBudgetCard } from "@/components/app/my-health-companion/WeeklyBudgetCard";
import { DailyChecklistCard } from "@/components/app/my-health-companion/DailyChecklistCard"; 
import { HelpfulTopicsCard } from "@/components/app/my-health-companion/HelpfulTopicsCard";
import { RewardsCard } from "@/components/app/my-health-companion/RewardsCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { userSettings, isLoading } = useAppContext(); 

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-6">
        <header className="mb-8">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" /> 
            <div>
              <Skeleton className="h-7 w-48 mb-1" /> 
              <Skeleton className="h-5 w-64" /> 
            </div>
          </div>
        </header>
        <Separator className="my-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 Skeletons */}
          <section className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" /> {/* IntakeProgressCard Skeleton */}
            <Skeleton className="h-72 w-full rounded-lg" /> {/* DailyChecklistCard Skeleton */}
            <Skeleton className="h-60 w-full rounded-lg" /> {/* RewardsCard Skeleton */}
            <Skeleton className="h-56 w-full rounded-lg" /> {/* HelpfulTopicsCard Skeleton */}
          </section>
          {/* Column 2 Skeletons (Weekly Budget on Desktop) */}
          <aside className="hidden lg:block space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" /> {/* WeeklyBudgetCard Skeleton */}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10"> {/* Adjusted from h-12 w-12 */}
            <AvatarImage src={`https://placehold.co/100x100.png?text=${userSettings.name.substring(0,1)}`} alt={userSettings.name} data-ai-hint="avatar person" />
            <AvatarFallback>{userSettings.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            {/* Adjusted text sizes to match other pages for consistency */}
            <h1 className="text-2xl md:text-3xl font-bold text-primary">MyHealthCompanion</h1>
            <p className="text-md md:text-lg text-muted-foreground">Hello, {userSettings.name}! Ready for today?</p>
          </div>
        </div>
      </header>

      <Separator className="my-6" />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Progress, Checklist, Rewards, Topics */}
        <section className="lg:col-span-2 space-y-6">
          <IntakeProgressCard />
          <DailyChecklistCard /> 
          <RewardsCard />
          <HelpfulTopicsCard /> 
        </section>

        {/* Column 2: Summaries (Weekly Budget on Desktop) */}
        <aside className="hidden lg:block space-y-6">
           <WeeklyBudgetCard />
        </aside>
      </main>
    </div>
  );
}
