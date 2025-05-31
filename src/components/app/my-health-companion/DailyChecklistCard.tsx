
"use client";

import { useAppContext } from "./AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, Sparkles } from "lucide-react";
import type { ChecklistItem } from "./types";

export function DailyChecklistCard() {
  const { dailyChecklist, toggleChecklistItem, isLoading } = useAppContext();

  if (isLoading || !dailyChecklist) {
    // You can return a skeleton loader here if preferred
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">Daily Habits Checklist</CardTitle>
                <CardDescription>Loading your daily goals...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                            <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
  }

  const { items } = dailyChecklist;

  const handleCheckboxChange = (itemId: string) => {
    toggleChecklistItem(itemId);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <ClipboardCheck className="mr-2 h-6 w-6 text-primary" />
            Daily Habits Checklist
          </CardTitle>
          <Sparkles className="h-6 w-6 text-accent"/>
        </div>
        <CardDescription>Track your healthy habits for today. Resets daily!</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ScrollArea className="max-h-72 pr-3"> {/* Added max-h and pr for scrollbar spacing */}
            <div className="space-y-4">
              {items.map((item: ChecklistItem) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`checklist-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={() => handleCheckboxChange(item.id)}
                    aria-labelledby={`label-checklist-${item.id}`}
                  />
                  <Label
                    htmlFor={`checklist-${item.id}`}
                    id={`label-checklist-${item.id}`}
                    className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                  >
                    {item.text}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">No checklist items for today yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
