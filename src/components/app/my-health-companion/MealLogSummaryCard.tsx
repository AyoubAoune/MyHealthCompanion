
"use client";

import { useAppContext } from "./AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MEAL_TYPES, type MealType, type LoggedEntry } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageOpen } from "lucide-react";

export function MealLogSummaryCard() {
  const { currentDayLog } = useAppContext();

  // Prepare data structure to hold entries and total calories for each meal type
  const mealsData: Record<MealType, { entries: LoggedEntry[]; totalCalories: number }> = 
    MEAL_TYPES.reduce((acc, type) => {
      acc[type] = { entries: [], totalCalories: 0 };
      return acc;
    }, {} as Record<MealType, { entries: LoggedEntry[]; totalCalories: number }>);

  if (currentDayLog && currentDayLog.entries && currentDayLog.entries.length > 0) {
    currentDayLog.entries.forEach(entry => {
      if (mealsData[entry.mealType]) { // Ensure the mealType from entry is valid
        mealsData[entry.mealType].entries.push(entry);
        mealsData[entry.mealType].totalCalories += entry.calories;
      }
    });
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Today's Logged Meals</CardTitle>
        <CardDescription>A summary of what you've eaten today, by meal. Click to expand.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Always render the accordion now */}
        <Accordion type="multiple" className="w-full">
          {MEAL_TYPES.map((mealType) => {
            const { entries, totalCalories } = mealsData[mealType];
            return (
              <AccordionItem value={mealType} key={mealType}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between w-full pr-2">
                    <span className="font-semibold">{mealType}</span>
                    <span className="text-primary font-medium">{Math.round(totalCalories)} kcal</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {entries.length > 0 ? (
                    <ScrollArea className="max-h-48"> {/* Max height with scroll */}
                      <ul className="space-y-1 pl-4 pr-2 py-2 text-sm">
                        {entries.map((entry) => (
                          <li key={entry.id} className="flex justify-between items-center">
                            <span>{entry.foodItemName} ({entry.quantity}g)</span>
                            <span className="text-muted-foreground">{Math.round(entry.calories)} kcal</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-4 pr-2 py-2">No items logged for {mealType}.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

