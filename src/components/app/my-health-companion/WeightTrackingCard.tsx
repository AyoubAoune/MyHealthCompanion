
"use client";

import { useState } from "react";
import { WeightTrendChartClient } from "./WeightTrendChartClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, PlusCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";

export function WeightTrackingCard() {
  const { weightLogs, logWeight } = useAppContext();
  const [currentWeight, setCurrentWeight] = useState("");
  const { toast } = useToast();

  // Log weightLogs for debugging
  console.log("WeightTrackingCard - weightLogs:", JSON.stringify(weightLogs, null, 2));

  const handleLogWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(currentWeight);
    if (!isNaN(weightValue) && weightValue > 0) {
      logWeight(weightValue);
      setCurrentWeight("");
      toast({
        title: "Weight Logged!",
        description: `Your weight of ${weightValue} kg has been recorded.`,
        variant: "default",
        className: "bg-accent text-accent-foreground",
      });
    } else {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid positive number for weight.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Weight Tracking</CardTitle>
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>Monitor your weight fluctuations over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleLogWeightSubmit} className="space-y-3">
          <div>
            <Label htmlFor="weight-input">Current Weight (kg)</Label>
            <div className="flex space-x-2">
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                placeholder="e.g., 70.5"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                min="0"
              />
              <Button type="submit" size="icon" aria-label="Log Weight">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Weight Trend</h3>
          <WeightTrendChartClient weightLogs={weightLogs} />
        </div>
      </CardContent>
    </Card>
  );
}
