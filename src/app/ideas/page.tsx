
"use client";

import { useState } from "react";
import { MealPreferencesAndSuggestions } from "@/components/app/my-health-companion/MealPreferencesAndSuggestions";
import { IngredientMealSuggester } from "@/components/app/my-health-companion/IngredientMealSuggester";
import { GroceryListSuggester } from "@/components/app/my-health-companion/GroceryListSuggester";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ClipboardList, X } from "lucide-react";

export default function IdeasPage() {
  const { userSettings, isLoading: appContextIsLoading } = useAppContext();
  const { toast } = useToast();

  const [draftGroceryItemsFromMeals, setDraftGroceryItemsFromMeals] = useState<string[]>([]);

  const handleAddIngredientsToDraft = (ingredients: string[]) => {
    const newDraftItems = [...new Set([...draftGroceryItemsFromMeals, ...ingredients])];
    setDraftGroceryItemsFromMeals(newDraftItems);
    toast({
      title: "Ingredients Added to Draft",
      description: `${ingredients.join(', ')} added to your draft grocery list.`,
      className: "bg-accent text-accent-foreground",
    });
  };

  const handleRemoveIngredientFromDraft = (ingredientToRemove: string) => {
    setDraftGroceryItemsFromMeals(prev => prev.filter(item => item !== ingredientToRemove));
     toast({
      title: "Ingredient Removed",
      description: `${ingredientToRemove} removed from your draft grocery list.`,
    });
  };

  const clearDraftGroceryItems = () => {
    setDraftGroceryItemsFromMeals([]);
  };

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
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                <Skeleton className="h-96 w-full md:flex-1 rounded-lg mb-6 md:mb-0" />
                <Skeleton className="h-80 w-full md:flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-72 w-full rounded-lg" /> 
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
      
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:flex-1 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Not sure what to eat?</h2>
            <MealPreferencesAndSuggestions onAddIngredientsToDraft={handleAddIngredientsToDraft} />
          </div>
          
          <div className="md:flex-1 w-full">
            <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Get Ideas from Your Ingredients</h2>
            <IngredientMealSuggester />
          </div>
        </div>

        <Separator className="my-6 md:my-8" />

        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">Plan Your Healthy Shopping</h2>
          {draftGroceryItemsFromMeals.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-secondary/30">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-secondary-foreground flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5"/>
                  Draft Grocery Items from Meal Ideas
                </h3>
                <Button variant="ghost" size="sm" onClick={clearDraftGroceryItems} className="text-xs">
                  Clear All
                </Button>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {draftGroceryItemsFromMeals.map(item => (
                  <li key={item} className="flex justify-between items-center">
                    <span>{item}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveIngredientFromDraft(item)}>
                      <X className="h-3 w-3"/>
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">These items will be considered by the AI when you generate your grocery list below.</p>
            </div>
          )}
          <GroceryListSuggester 
            draftItemsFromMeals={draftGroceryItemsFromMeals} 
            onClearDraftItems={clearDraftGroceryItems} 
          />
        </div>
      </div>
    </div>
  );
}
