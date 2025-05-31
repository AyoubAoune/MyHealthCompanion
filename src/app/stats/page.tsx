
"use client";

import { WeightTrackingCard } from "@/components/app/my-health-companion/WeightTrackingCard";
import { WaistSizeTrackingCard } from "@/components/app/my-health-companion/WaistSizeTrackingCard"; // New import
import { WeeklyBudgetCard } from "@/components/app/my-health-companion/WeeklyBudgetCard";
import { Last7DaysCaloriesStat } from "@/components/app/my-health-companion/Last7DaysCaloriesStat";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsPage() {
  const { userSettings, isLoading } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-6">
        <header className="mb-8">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-lg" /> {/* WeightTrackingCard */}
          <Skeleton className="h-80 w-full rounded-lg" /> {/* WaistSizeTrackingCard */}
          <Skeleton className="h-64 w-full rounded-lg" /> {/* WeeklyBudgetCard (adjust height if needed) */}
          <Skeleton className="h-40 w-full rounded-lg md:col-span-2" /> {/* Last7DaysCaloriesStat */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8 flex items-center space-x-3">
        <Avatar className="h-10 w-10 hidden md:flex">
           <AvatarImage src={`https://placehold.co/100x100.png?text=${userSettings.name.substring(0,1)}`} alt={userSettings.name} data-ai-hint="avatar person" />
           <AvatarFallback>{userSettings.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Your Statistics</h1>
          <p className="text-md md:text-lg text-muted-foreground">Review your progress and trends.</p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeightTrackingCard />
        <WaistSizeTrackingCard /> {/* Added new card */}
        <WeeklyBudgetCard />
        <div className="md:col-span-2">
          <Last7DaysCaloriesStat />
        </div>
      </div>
    </div>
  );
}
