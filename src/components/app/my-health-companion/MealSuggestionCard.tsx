
"use client";

import { useState, useEffect } from "react";
import type { MealSuggestionPreferences } from "./types";
import { suggestMeals, type SuggestMealsOutput, type SuggestMealsInput } from "@/ai/flows/suggest-meals";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";

export function MealSuggestionCard({ timeOfDay }: { timeOfDay: string }) {
  const { userSettings } = useAppContext();

  const [preferences, setPreferences] = useState<Omit<MealSuggestionPreferences, 'timeOfDay'>>({
    calorieLimit: 0, 
    dietaryPreferences: "",
    avoidFoods: "",
  });
  const [suggestions, setSuggestions] = useState<SuggestMealsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    const targetCalorieLimit = userSettings.dailyCalorieTarget;
    setPreferences(prev => ({
      ...prev,
      calorieLimit: (typeof targetCalorieLimit === 'number' && !Number.isNaN(targetCalorieLimit)) ? targetCalorieLimit : 0,
    }));
  }, [userSettings.dailyCalorieTarget]);

  const handleInputChange = (field: keyof Omit<MealSuggestionPreferences, 'timeOfDay'>, value: string) => {
    if (field === 'calorieLimit') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setPreferences(prev => ({ ...prev, calorieLimit: numValue }));
      } else if (value === "") {
        setPreferences(prev => ({ ...prev, calorieLimit: 0 }));
      }
    } else {
      setPreferences(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuggestions(null);

    const submitInput: SuggestMealsInput = {
      ...preferences,
      calorieLimit: Number.isNaN(preferences.calorieLimit) ? 0 : preferences.calorieLimit,
      timeOfDay: timeOfDay, 
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
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{timeOfDay} Ideas</CardTitle>
          <Lightbulb className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>Get AI-powered meal suggestions for your {timeOfDay.toLowerCase()}.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`calorie-limit-${timeOfDay.replace(/\s+/g, '-')}`}>Calorie Limit (kcal)</Label>
            <Input
              id={`calorie-limit-${timeOfDay.replace(/\s+/g, '-')}`}
              type="number"
              value={preferences.calorieLimit.toString()}
              onChange={(e) => handleInputChange('calorieLimit', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`dietary-preferences-${timeOfDay.replace(/\s+/g, '-')}`}>Dietary Preferences</Label>
            <Input
              id={`dietary-preferences-${timeOfDay.replace(/\s+/g, '-')}`}
              type="text"
              placeholder="e.g., vegetarian, low-carb"
              value={preferences.dietaryPreferences}
              onChange={(e) => handleInputChange('dietaryPreferences', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`avoid-foods-${timeOfDay.replace(/\s+/g, '-')}`}>Foods to Avoid</Label>
            <Input
              id={`avoid-foods-${timeOfDay.replace(/\s+/g, '-')}`}
              type="text"
              placeholder="e.g., peanuts, dairy, gluten"
              value={preferences.avoidFoods}
              onChange={(e) => handleInputChange('avoidFoods', e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Get Suggestions
          </Button>
          {suggestions && (
            <div className="mt-4 p-4 border rounded-md bg-secondary/30 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-2">Suggested Meals:</h4>
              <pre className="whitespace-pre-wrap text-sm">{suggestions.mealSuggestions}</pre>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
