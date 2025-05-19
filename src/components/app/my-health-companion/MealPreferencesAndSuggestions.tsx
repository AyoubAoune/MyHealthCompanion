
"use client";

import { useState, useEffect } from "react";
import { suggestMeals, type SuggestMealsOutput, type SuggestMealsInput } from "@/ai/flows/suggest-meals";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";
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

  const [suggestions, setSuggestions] = useState<SuggestMealsOutput | null>(null);
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
    setSuggestions(null);

    const submitInput: SuggestMealsInput = {
      calorieLimit: Number.isNaN(calorieLimit) ? 0 : calorieLimit,
      dietaryPreferences,
      avoidFoods,
      timeOfDay,
    };

    try {
      const result = await suggestMeals(submitInput);
      setSuggestions(result);
      toast({
        title: "Meals Suggested!",
        description: "Here are some ideas based on your preferences.",
      });
    } catch (error) {
      console.error("Error fetching meal suggestions:", error);
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
              <Label htmlFor="calorie-limit">Calorie Limit (kcal)</Label>
              <Input
                id="calorie-limit"
                type="number"
                value={calorieLimit.toString()}
                onChange={(e) => handleCalorieInputChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dietary-preferences">Dietary Preferences</Label>
              <Input
                id="dietary-preferences"
                type="text"
                placeholder="e.g., vegetarian, low-carb"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avoid-foods">Foods to Avoid</Label>
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

      {suggestions && (
        <>
          <Separator />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Your Meal Suggestions for {timeOfDay}</CardTitle>
              <CardDescription>Here are some AI-powered ideas based on your criteria.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-md max-h-96 overflow-y-auto">
                {suggestions.mealSuggestions}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
