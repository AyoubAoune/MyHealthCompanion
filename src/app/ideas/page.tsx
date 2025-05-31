
"use client";

import { MealPreferencesAndSuggestions } from "@/components/app/my-health-companion/MealPreferencesAndSuggestions";
import { IngredientMealSuggester } from "@/components/app/my-health-companion/IngredientMealSuggester";
import { GroceryListSuggester } from "@/components/app/my-health-companion/GroceryListSuggester"; // New import
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator"; // New import

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
        {/* Skeletons for side-by-side layout and new section */}
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                <Skeleton className="h-96 w-full md:flex-1 rounded-lg mb-6 md:mb-0" />
                <Skeleton className="h-80 w-full md:flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-72 w-full rounded-lg" /> {/* Skeleton for GroceryListSuggester */}
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
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Meal & Grocery Ideas</h1>
          <p className="text-md md:text-lg text-muted-foreground">Discover AI-powered suggestions tailored to your needs.</p>
        </div>
      </header>
      
      {/* Container for sections */}
      <div className="max-w-5xl mx-auto space-y-10"> {/* Added space-y-10 for separation */}
        {/* Section 1: Meal Preferences & Ingredient Suggester */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Card: Meal Preferences */}
          <div className="md:flex-1 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Not sure what to eat?</h2>
            <MealPreferencesAndSuggestions />
          </div>
          
          {/* Right Card: Ingredient Suggester */}
          <div className="md:flex-1 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Get Ideas from Your Ingredients</h2>
            <IngredientMealSuggester />
          </div>
        </div>

        <Separator className="my-6 md:my-8" /> {/* Separator between sections */}

        {/* Section 2: Grocery List Suggester */}
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Plan Your Healthy Shopping</h2>
          <GroceryListSuggester />
        </div>
      </div>
    </div>
  );
}
