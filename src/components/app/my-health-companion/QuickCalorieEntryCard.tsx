
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, PlusCircle } from "lucide-react"; // Changed icon
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";

export function QuickCalorieEntryCard() {
  const { logQuickCalories } = useAppContext();
  const { toast } = useToast();
  const [calories, setCalories] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numCalories = parseInt(calories, 10);

    if (isNaN(numCalories) || numCalories <= 0) {
      toast({
        title: "Invalid Calorie Amount",
        description: "Please enter a valid positive number for calories.",
        variant: "destructive",
      });
      return;
    }

    if (logQuickCalories) {
      logQuickCalories(numCalories);
      toast({
        title: "Calories Logged!",
        description: `${numCalories} kcal (Quick Entry) have been added to your log.`,
        className: "bg-accent text-accent-foreground",
      });
      setCalories(""); // Reset input
    } else {
       toast({
        title: "Error",
        description: "Could not log quick calories. Function not available.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Quick Calorie Entry</CardTitle>
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>Log a raw calorie amount for today without searching for specific food items.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-1">
            <Label htmlFor="quick-calories">Calories (kcal)</Label>
            <Input
              id="quick-calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 350"
              min="1"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!calories.trim()}>
            <PlusCircle className="mr-2 h-5 w-5" /> Log Quick Calories
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
