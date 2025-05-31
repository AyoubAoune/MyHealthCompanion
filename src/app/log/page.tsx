
"use client";

import { LogIntakeForm } from "@/components/app/my-health-companion/LogIntakeForm";
import { MealLogSummaryCard } from "@/components/app/my-health-companion/MealLogSummaryCard";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";


export default function LogPage() {
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
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto"> {/* Adjusted max-width */}
          <Skeleton className="h-96 w-full md:flex-1 rounded-lg mb-6 md:mb-0" />
          <Skeleton className="h-80 w-full md:flex-1 rounded-lg" />
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
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Log Your Intake</h1>
          <p className="text-md md:text-lg text-muted-foreground">Keep track of your daily nutrition.</p>
        </div>
      </header>
      <div className="max-w-4xl mx-auto"> {/* Adjusted max-width from max-w-5xl */}
        <div className="flex flex-col md:flex-row md:gap-8 space-y-8 md:space-y-0">
          <div className="md:flex-1 w-full">
            <LogIntakeForm />
          </div>
          <div className="md:flex-1 w-full">
            <MealLogSummaryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
