
"use client";

import { MealPreferencesAndSuggestions } from "@/components/app/my-health-companion/MealPreferencesAndSuggestions";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdeasPage() {
  const { userSettings, isLoading: appContextIsLoading } = useAppContext();

  if (appContextIsLoading) {
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
        <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-lg" />
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
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Meal Ideas</h1>
          <p className="text-md md:text-lg text-muted-foreground">Discover AI-powered suggestions tailored to your needs.</p>
        </div>
      </header>
      <div className="max-w-2xl mx-auto">
        <MealPreferencesAndSuggestions />
      </div>
    </div>
  );
}
