
"use client";

import { useState } from "react";
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
  // Add more mappings as needed
};

export function GroceryListSuggester() {
  const { dailyLogs } = useAppContext();
  const { toast } = useToast();

  const [customPreferences, setCustomPreferences] = useState<string>("");
  const [suggestedGroceryList, setSuggestedGroceryList] = useState<GroceryListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuggestedGroceryList(null);

    // Get unique food names from the last 14 days of logs, up to 30 items
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
    
    const submitInput: SuggestGroceryListInput = {
      loggedFoodItems: recentFoodEntries,
      customPreferences: customPreferences.trim() === "" ? undefined : customPreferences,
    };

    try {
      const result: SuggestGroceryListOutput = await suggestGroceryList(submitInput);
      if (result && result.groceryList && result.groceryList.length > 0) {
        setSuggestedGroceryList(result.groceryList);
        toast({
          title: "Grocery List Generated!",
          description: "Here's a healthy shopping list for you.",
        });
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
          <CardDescription>Get AI-powered suggestions for your next healthy grocery trip, inspired by your logs.</CardDescription>
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
                The AI will also consider your recently logged foods to understand your general eating habits.
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
