
"use client";

import { MealSuggestionCard } from "@/components/app/my-health-companion/MealSuggestionCard";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdeasPage() {
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
        <Skeleton className="h-96 w-full max-w-md mx-auto rounded-lg" />
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
          <p className="text-md md:text-lg text-muted-foreground">Discover AI-powered suggestions.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">Breakfast</h3>
          <MealSuggestionCard timeOfDay="Breakfast" />
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
           <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">Morning Snack</h3>
           <MealSuggestionCard timeOfDay="Morning snack" />
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4">
           <h3 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Lunch</h3>
           <MealSuggestionCard timeOfDay="Lunch" />
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-4">
           <h3 className="text-lg font-semibold mb-4 text-purple-800 dark:text-purple-200">Afternoon Snack</h3>
           <MealSuggestionCard timeOfDay="Afternoon Snack" />
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4">
           <h3 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-200">Dinner</h3>
           <MealSuggestionCard timeOfDay="Dinner" />
        </div>
        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4">
           <h3 className="text-lg font-semibold mb-4 text-indigo-800 dark:text-indigo-200">Late Snack</h3>
           <MealSuggestionCard timeOfDay="Late Snack" />
        </div>
      </div>
    </div>
  );
}

// Add this interface to define the props for MealSuggestionCard
interface MealSuggestionCardProps {
  timeOfDay: string;
}

// Update the MealSuggestionCard component to accept the prop
// This part needs to be done in MealSuggestionCard.tsx, adding:
// interface MealSuggestionCardProps { timeOfDay?: string; }
// and changing the component signature to:
// export function MealSuggestionCard({ timeOfDay }: MealSuggestionCardProps) {
// and using timeOfDay in the state and prompt.

