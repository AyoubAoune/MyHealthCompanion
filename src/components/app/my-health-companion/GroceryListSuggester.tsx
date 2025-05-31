
"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "./AppContext";
import { 
  suggestGroceryList, 
  type SuggestGroceryListOutput, 
  type SuggestGroceryListInput,
  type GroceryListItem
} from "@/ai/flows/suggest-grocery-list-flow";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Sparkles, Loader2, ListChecks, Banana, Carrot, Fish } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { getLastNDaysFormatted, parseDate } from "./date-utils";
import type { DailyLog } from "./types";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "fresh produce": Carrot,
  "fruits": Banana,
  "vegetables": Carrot,
  "proteins": Fish,
  "lean proteins & plant-based alternatives": Fish,
  "dairy & alternatives": () => <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M15.025 7.025H8.975A.975.975 0 0 0 8 8v10.025c0 .525.425.95.95.95h6.05c.525 0 .975-.425.975-.95V8c0-.55-.45-.975-.975-.975M12 2a1 1 0 0 0-1 1v2h2V3a1 1 0 0 0-1-1m-5 1h2V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v1zm10 0h2V2a1 1 0 0 0-1-1h-1a1 1 0 0 0 0 2m-2.5 12.75h-1.1v-4.6h1.1zm0-5.625h-1.1v-1.1h1.1zm0-2.125h-1.1v-1.1h1.1zm-2.375 0h-1.1v-1.1h1.1z"/></svg>, // Example inline SVG
  "pantry staples": ShoppingCart,
  "whole grains & legumes": () => <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19.88 8.28L12.07 1.7c-.8-.72-2.13-.72-2.93 0L1.32 8.28C.42 9 .32 10.32 1.05 11.2A5.493 5.493 0 0 1 4.8 12.9c0 .7.13 1.38.36 2.03L3.9 20.1c-.1.68.38 1.32 1.06 1.43c.68.1 1.32-.38 1.42-1.06l1.1-6.92c.3-.12.6-.26.9-.42l.9 6.92c.1.68.75 1.17 1.42 1.06c.68-.1 1.16-.75 1.06-1.43l-1.26-7.57c1.31-.72 2.24-2.02 2.24-3.48c0-.7-.13-1.38-.36-2.03L16.4 19c-.1.68.38 1.32 1.06 1.43c.68.1 1.32-.38 1.42-1.06l.87-6.55c2.17-.36 3.65-2.22 3.17-4.32c-.2-.9-.8-1.58-1.56-1.97M6.83 11.42c-.6-.28-1.12-.68-1.54-1.17c-.52-.6-.46-1.5.14-2.02l6.82-6c.3-.27.79-.27 1.1 0l6.8 6c.6.52.66 1.42.14 2.02c-.42.5-1.17.94-2.08 1.17c-.46.1-.9.16-1.32.16c-.2 0-.4-.02-.6-.05c-.6-.1-1.12-.42-1.52-.87L12.8 7.8c-.4-.48-1.18-.48-1.58 0l-1.95 2.7c-.4.45-.92.77-1.52.87c-.2.03-.4.05-.6.05c-.2 0-.4-.02-.52-.05"/></svg>, // Example inline SVG for whole grains
  "healthy fats & pantry staples": ShoppingCart,
  // Add more mappings as needed
};

interface GroceryListSuggesterProps {
  draftItemsFromMeals: string[];
  onClearDraftItems: () => void;
}

export function GroceryListSuggester({ draftItemsFromMeals, onClearDraftItems }: GroceryListSuggesterProps) {
  const { dailyLogs } = useAppContext();
  const { toast } = useToast();

  const [customPreferences, setCustomPreferences] = useState<string>("");
  const [suggestedGroceryList, setSuggestedGroceryList] = useState<GroceryListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuggestedGroceryList(null);

    const last14DaysDates = getLastNDaysFormatted(14);
    const recentFoodEntries: string[] = [];
    const seenFoodNames = new Set<string>();

    last14DaysDates.forEach(dateStr => {
      const logForDate: DailyLog | undefined = dailyLogs.find(dlog => dlog.date === dateStr);
      if (logForDate) {
        logForDate.entries.forEach(entry => {
          if (!seenFoodNames.has(entry.foodItemName.toLowerCase()) && seenFoodNames.size < 30) {
            seenFoodNames.add(entry.foodItemName.toLowerCase());
            recentFoodEntries.push(entry.foodItemName);
          }
        });
      }
    });
    
    let combinedPreferences = customPreferences.trim();
    if (draftItemsFromMeals.length > 0) {
      const draftItemsString = `Consider these items I've picked from meal suggestions: ${draftItemsFromMeals.join(', ')}.`;
      combinedPreferences = combinedPreferences 
        ? `${draftItemsString} Also, ${combinedPreferences}`
        : draftItemsString;
    }
    
    const submitInput: SuggestGroceryListInput = {
      loggedFoodItems: recentFoodEntries,
      customPreferences: combinedPreferences === "" ? undefined : combinedPreferences,
    };

    try {
      const result: SuggestGroceryListOutput = await suggestGroceryList(submitInput);
      if (result && result.groceryList && result.groceryList.length > 0) {
        setSuggestedGroceryList(result.groceryList);
        toast({
          title: "Grocery List Generated!",
          description: "Here's a healthy shopping list for you.",
        });
        onClearDraftItems(); // Clear draft items after successful generation
      } else {
        setSuggestedGroceryList([]); 
        toast({
          title: "No Suggestions",
          description: "Could not generate a grocery list. Please try adjusting your preferences or try again later.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching grocery list suggestions:", error);
      setSuggestedGroceryList([]);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col">
      <Card className="shadow-lg flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">AI Grocery List Helper</CardTitle>
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>Get AI-powered suggestions for your next healthy grocery trip, inspired by your logs and choices.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <CardContent className="space-y-4 flex-grow">
            <div>
              <Label htmlFor="custom-preferences-grocery">Any Specific Preferences for this List? (Optional)</Label>
              <Textarea
                id="custom-preferences-grocery"
                placeholder="e.g., vegetarian, need items for quick lunches, trying to eat more fish..."
                value={customPreferences}
                onChange={(e) => setCustomPreferences(e.target.value)}
                rows={2}
              />
               <p className="text-xs text-muted-foreground mt-1">
                The AI will also consider your recently logged foods and items you added from meal suggestions.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Healthy Grocery List
            </Button>
          </CardFooter>
        </form>
      </Card>

      {suggestedGroceryList && suggestedGroceryList.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-4 flex-shrink-0"> 
            <h2 className="text-lg font-semibold text-primary flex items-center"> 
              <ListChecks className="mr-2 h-6 w-6" />
              Your Suggested Grocery List
            </h2>
            <Accordion type="multiple" defaultValue={suggestedGroceryList.map(g => g.category)} className="w-full">
              {suggestedGroceryList.map((group) => {
                const IconComponent = CATEGORY_ICONS[group.category.toLowerCase()] || ShoppingCart;
                return (
                  <AccordionItem value={group.category} key={group.category}>
                    <AccordionTrigger className="hover:no-underline text-base">
                      <div className="flex items-center">
                        <IconComponent className="mr-2 h-5 w-5 text-muted-foreground" />
                        {group.category} ({group.items.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="max-h-48">
                        <ul className="space-y-1.5 pl-6 pr-2 py-2 text-sm list-disc list-outside">
                          {group.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-muted-foreground">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </>
      )}
      {suggestedGroceryList && suggestedGroceryList.length === 0 && !isLoading && (
         <Card className="shadow-md flex-shrink-0">
            <CardHeader>
                <CardTitle className="text-base">No Suggestions Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">We couldn't generate any grocery suggestions based on your input and logs. Please try again or adjust your custom preferences.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
