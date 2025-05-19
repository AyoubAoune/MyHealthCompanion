
"use client";

import { useAppContext } from "./AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MEAL_TYPES, type MealType, type LoggedEntry } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageOpen } from "lucide-react";

export function MealLogSummaryCard() {
  const { currentDayLog } = useAppContext();

  if (!currentDayLog || !currentDayLog.entries || currentDayLog.entries.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Today's Logged Meals</CardTitle>
          <CardDescription>A summary of what you've eaten today, by meal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <PackageOpen className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No food logged yet for today.</p>
            <p className="text-sm">Start logging your meals to see them here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mealsData: Record<MealType, { entries: LoggedEntry[]; totalCalories: number }> = 
    MEAL_TYPES.reduce((acc, type) => {
      acc[type] = { entries: [], totalCalories: 0 };
      return acc;
    }, {} as Record<MealType, { entries: LoggedEntry[]; totalCalories: number }>);

  currentDayLog.entries.forEach(entry => {
    if (mealsData[entry.mealType]) {
      mealsData[entry.mealType].entries.push(entry);
      mealsData[entry.mealType].totalCalories += entry.calories;
    }
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Today's Logged Meals</CardTitle>
        <CardDescription>A summary of what you've eaten today, by meal. Click to expand.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" collapsible className="w-full">
          {MEAL_TYPES.map((mealType) => { // Iterate over all MEAL_TYPES
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

