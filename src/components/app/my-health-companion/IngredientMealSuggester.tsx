
"use client";

import { useState } from "react";
import { 
  suggestMealsFromIngredients, 
  type SuggestMealsFromIngredientsOutput, 
  type SuggestMealsFromIngredientsInput,
  type SuggestedMealItem
} from "@/ai/flows/suggest-meal-from-ingredients";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Loader2, Utensils, Salad } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const mealTypes = [
  "Any",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
];

export function IngredientMealSuggester() {
  const { toast } = useToast();

  const [ingredients, setIngredients] = useState<string>("");
  const [mealType, setMealType] = useState<string>(mealTypes[0]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string>("");

  const [suggestedMealsList, setSuggestedMealsList] = useState<SuggestedMealItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) {
        toast({ title: "Ingredients Required", description: "Please list some ingredients you have.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setSuggestedMealsList(null);

    const submitInput: SuggestMealsFromIngredientsInput = {
      ingredients,
      mealType: mealType === "Any" ? undefined : mealType,
      dietaryPreferences: dietaryPreferences.trim() === "" ? undefined : dietaryPreferences,
    };

    try {
      const result: SuggestMealsFromIngredientsOutput = await suggestMealsFromIngredients(submitInput);
      if (result && result.mealSuggestions && result.mealSuggestions.length > 0) {
        setSuggestedMealsList(result.mealSuggestions);
        toast({
          title: "Meals Suggested!",
          description: `Here are some ideas for your ingredients.`,
        });
      } else {
        setSuggestedMealsList([]); 
        toast({
          title: "No Suggestions Found",
          description: "Could not generate any meal suggestions. Please try rephrasing your ingredients or try again.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching meal suggestions from ingredients:", error);
      setSuggestedMealsList([]);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching meal suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Meal from Your Ingredients</CardTitle>
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>Tell us what ingredients you have, and we'll suggest some meals!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <CardContent className="space-y-4 flex-grow">
            <div>
              <Label htmlFor="ingredients-input">Available Ingredients</Label>
              <Textarea
                id="ingredients-input"
                placeholder="e.g., chicken breast, broccoli, rice, soy sauce"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="meal-type-select-ingredients">Desired Meal Type (optional)</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="meal-type-select-ingredients">
                  <SelectValue placeholder="Select a meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dietary-preferences-ingredients">Dietary Preferences (optional)</Label>
              <Input
                id="dietary-preferences-ingredients"
                type="text"
                placeholder="e.g., vegetarian, gluten-free"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !ingredients.trim()} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Suggest Meals with Ingredients
            </Button>
          </CardFooter>
        </form>
      </Card>

      {suggestedMealsList && suggestedMealsList.length > 0 && (
        <>
          <Separator className="my-4" /> {/* Adjusted margin for separator */}
          <div className="space-y-4 flex-shrink-0"> {/* Added flex-shrink-0 here */}
            <h2 className="text-lg font-semibold text-primary flex items-center"> {/* Adjusted heading size */}
              <Salad className="mr-2 h-6 w-6" />
              Your Meal Suggestions
            </h2>
            {suggestedMealsList.map((meal, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{meal.name}</CardTitle> {/* Adjusted title size */}
                    <Utensils className="h-5 w-5 text-accent"/>
                  </div>
                  {meal.calories && (
                    <CardDescription className="text-xs text-accent-foreground font-medium"> {/* Adjusted text size */}
                      {meal.calories}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{meal.description}</p> {/* Adjusted text size */}
                  {meal.ingredientsUsed && meal.ingredientsUsed.length > 0 && (
                      <div className="mt-3">
                          <p className="text-xs font-semibold">Key ingredients used:</p>
                          <p className="text-xs text-muted-foreground">{meal.ingredientsUsed.join(', ')}</p>
                      </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {suggestedMealsList && suggestedMealsList.length === 0 && !isLoading && (
         <Card className="shadow-md flex-shrink-0"> {/* Added flex-shrink-0 here */}
            <CardHeader>
                <CardTitle className="text-base">No Suggestions Found</CardTitle> {/* Adjusted title size */}
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">We couldn't generate any meal suggestions based on your input. Please try again or adjust your ingredients.</p> {/* Adjusted text size */}
            </CardContent>
          </Card>
      )}
    </div>
  );
}
