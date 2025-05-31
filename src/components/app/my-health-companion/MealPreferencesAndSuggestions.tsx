
"use client";

import { useState, useEffect } from "react";
import { suggestMeals, type SuggestMealsOutput, type SuggestMealsInput, type MealItem } from "@/ai/flows/suggest-meals";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, Loader2, Salad, ListPlus, ShoppingBasket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const mealTimes = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Late Snack",
];

interface MealPreferencesAndSuggestionsProps {
  onAddIngredientsToDraft: (ingredients: string[]) => void;
}

export function MealPreferencesAndSuggestions({ onAddIngredientsToDraft }: MealPreferencesAndSuggestionsProps) {
  const { toast } = useToast();

  const [timeOfDay, setTimeOfDay] = useState<string>(mealTimes[0]);
  const [calorieLimit, setCalorieLimit] = useState<number>(200); 
  const [dietaryPreferences, setDietaryPreferences] = useState<string>("");
  const [avoidFoods, setAvoidFoods] = useState<string>("");

  const [suggestedMeals, setSuggestedMeals] = useState<MealItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalorieInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setCalorieLimit(numValue);
    } else if (value === "") {
      setCalorieLimit(0); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeOfDay) {
        toast({ title: "Time of Day Required", description: "Please select a time of day for meal suggestions.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    setSuggestedMeals(null);

    const submitInput: SuggestMealsInput = {
      calorieLimit: Number.isNaN(calorieLimit) ? 0 : calorieLimit, 
      dietaryPreferences,
      avoidFoods,
      timeOfDay,
    };

    try {
      const result: SuggestMealsOutput = await suggestMeals(submitInput);
      if (result && result.mealSuggestions && result.mealSuggestions.length > 0) {
        setSuggestedMeals(result.mealSuggestions);
        toast({
          title: "Meals Suggested!",
          description: "Here are some ideas based on your preferences.",
        });
      } else {
        setSuggestedMeals([]);
        toast({
          title: "No Suggestions",
          description: "No meal suggestions were found for your criteria. Try adjusting your preferences.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching meal suggestions:", error);
      setSuggestedMeals([]);
      toast({
        title: "Error",
        description: "Could not fetch meal suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIngredientsClick = (ingredients?: string[]) => {
    if (ingredients && ingredients.length > 0) {
      onAddIngredientsToDraft(ingredients);
    } else {
      toast({
        title: "No Ingredients",
        description: "This meal suggestion does not have a list of ingredients to add.",
        variant: "default"
      })
    }
  };

  return (
    <div className="space-y-6 flex flex-col">
      <Card className="shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Set Your Meal Preferences</CardTitle>
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>Tell us what you're looking for, and we'll suggest some meal ideas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <CardContent className="space-y-4 flex-grow">
            <div>
              <Label htmlFor="time-of-day">Time of Day</Label>
              <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                <SelectTrigger id="time-of-day">
                  <SelectValue placeholder="Select a mealtime" />
                </SelectTrigger>
                <SelectContent>
                  {mealTimes.map((meal) => (
                    <SelectItem key={meal} value={meal}>{meal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="calorie-limit">Max Calorie Limit (kcal) for this meal</Label>
              <Input
                id="calorie-limit"
                type="number"
                value={calorieLimit.toString()} 
                onChange={(e) => handleCalorieInputChange(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="dietary-preferences">Dietary Preferences (optional)</Label>
              <Input
                id="dietary-preferences"
                type="text"
                placeholder="e.g., vegetarian, low-carb"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avoid-foods">Foods to Avoid (optional, comma-separated)</Label>
              <Input
                id="avoid-foods"
                type="text"
                placeholder="e.g., peanuts, dairy, gluten"
                value={avoidFoods}
                onChange={(e) => setAvoidFoods(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !timeOfDay} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get Suggestions
            </Button>
          </CardFooter>
        </form>
      </Card>

      {suggestedMeals && suggestedMeals.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="flex-1 min-h-0 space-y-4"> {/* MODIFIED: Was space-y-4 flex-shrink-0 */}
            <h2 className="text-lg font-semibold text-primary flex items-center">
              <Salad className="mr-2 h-5 w-5" />
              Your Meal Suggestions for {timeOfDay}
            </h2>
            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-3">
                {suggestedMeals.map((meal, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{meal.name}</CardTitle>
                      {meal.calories && (
                        <CardDescription className="text-xs text-accent-foreground font-medium">
                          {meal.calories}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3 space-y-2">
                      <p className="text-xs text-muted-foreground">{meal.description}</p>
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-secondary-foreground mb-1">Key Ingredients:</h4>
                          <ul className="list-disc list-inside pl-2 space-y-0.5">
                            {meal.ingredients.map((ingredient, i) => (
                              <li key={i} className="text-xs text-muted-foreground">{ingredient}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <CardFooter className="pt-0 pb-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => handleAddIngredientsClick(meal.ingredients)}
                        >
                          <ListPlus className="mr-2 h-3 w-3" />
                          Add Ingredients to Draft List
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
       {suggestedMeals && suggestedMeals.length === 0 && !isLoading && (
        <>
          <Separator className="my-4" />
          <Card className="shadow-md flex-shrink-0">
            <CardHeader>
                <CardTitle className="text-base">No Suggestions Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">We couldn't find any meal suggestions based on your current criteria. Please try adjusting your preferences, like increasing the calorie limit or removing some restrictions.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
