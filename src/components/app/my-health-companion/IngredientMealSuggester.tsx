
"use client";

import { useState } from "react";
import { suggestMealFromIngredients, type SuggestedMealFromIngredientsOutput, type SuggestMealFromIngredientsInput } from "@/ai/flows/suggest-meal-from-ingredients";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Loader2, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const [suggestedMeal, setSuggestedMeal] = useState<SuggestedMealFromIngredientsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredients.trim()) {
        toast({ title: "Ingredients Required", description: "Please list some ingredients you have.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setSuggestedMeal(null);

    const submitInput: SuggestMealFromIngredientsInput = {
      ingredients,
      mealType: mealType === "Any" ? undefined : mealType,
      dietaryPreferences: dietaryPreferences.trim() === "" ? undefined : dietaryPreferences,
    };

    try {
      const result: SuggestedMealFromIngredientsOutput = await suggestMealFromIngredients(submitInput);
      if (result && result.name && result.name !== "Suggestion Error") {
        setSuggestedMeal(result);
        toast({
          title: "Meal Suggested!",
          description: `Here's an idea for your ingredients: ${result.name}`,
        });
      } else {
        setSuggestedMeal(null); // Clear previous suggestion if any
        toast({
          title: "Suggestion Problem",
          description: result?.description || "Could not generate a meal suggestion. Please try rephrasing your ingredients or try again.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching meal suggestion from ingredients:", error);
      setSuggestedMeal(null);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching the meal suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Meal from Your Ingredients</CardTitle>
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>Tell us what ingredients you have, and we'll suggest a meal!</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <Label htmlFor="meal-type-select">Desired Meal Type (optional)</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="meal-type-select">
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
              Suggest Meal with Ingredients
            </Button>
          </CardFooter>
        </form>
      </Card>

      {suggestedMeal && suggestedMeal.name !== "Suggestion Error" && (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
                 <CardTitle className="text-lg">{suggestedMeal.name}</CardTitle>
                 <Utensils className="h-5 w-5 text-accent"/>
            </div>
            {suggestedMeal.calories && (
              <CardDescription className="text-sm text-accent-foreground font-medium">
                {suggestedMeal.calories}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{suggestedMeal.description}</p>
            {suggestedMeal.ingredientsUsed && suggestedMeal.ingredientsUsed.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-semibold">Key ingredients used:</p>
                    <p className="text-xs text-muted-foreground">{suggestedMeal.ingredientsUsed.join(', ')}</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}
      {suggestedMeal && suggestedMeal.name === "Suggestion Error" && !isLoading && (
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Suggestion Problem</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{suggestedMeal.description || "We couldn't generate a meal suggestion based on your input. Please try again or adjust your ingredients."}</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
