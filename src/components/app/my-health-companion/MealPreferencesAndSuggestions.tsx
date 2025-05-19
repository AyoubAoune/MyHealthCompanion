
"use client";

import { useState, useEffect } from "react";
import { suggestMeals, type SuggestMealsOutput, type SuggestMealsInput, type MealItem } from "@/ai/flows/suggest-meals";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, Loader2, Salad } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";
import { Separator } from "@/components/ui/separator";

const mealTimes = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Late Snack",
];

export function MealPreferencesAndSuggestions() {
  const { userSettings } = useAppContext();
  const { toast } = useToast();

  const [timeOfDay, setTimeOfDay] = useState<string>(mealTimes[0]);
  const [calorieLimit, setCalorieLimit] = useState<number>(0);
  const [dietaryPreferences, setDietaryPreferences] = useState<string>("");
  const [avoidFoods, setAvoidFoods] = useState<string>("");

  const [suggestedMeals, setSuggestedMeals] = useState<MealItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const targetCalorieLimit = userSettings.dailyCalorieTarget;
    setCalorieLimit((typeof targetCalorieLimit === 'number' && !Number.isNaN(targetCalorieLimit)) ? targetCalorieLimit : 0);
  }, [userSettings.dailyCalorieTarget]);

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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Set Your Meal Preferences</CardTitle>
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>Tell us what you're looking for, and we'll suggest some meal ideas.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
          <Separator />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary flex items-center">
              <Salad className="mr-2 h-6 w-6" />
              Your Meal Suggestions for {timeOfDay}
            </h2>
            {suggestedMeals.map((meal, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{meal.name}</CardTitle>
                  {meal.calories && (
                    <CardDescription className="text-sm text-accent-foreground font-medium">
                      {meal.calories}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{meal.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
       {suggestedMeals && suggestedMeals.length === 0 && !isLoading && (
        <>
          <Separator />
          <Card className="shadow-md">
            <CardHeader>
                <CardTitle>No Suggestions Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">We couldn't find any meal suggestions based on your current criteria. Please try adjusting your preferences, like increasing the calorie limit or removing some restrictions.</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

