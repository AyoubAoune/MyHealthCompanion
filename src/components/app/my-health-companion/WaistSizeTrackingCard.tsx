
"use client";

import { useState } from "react";
import { WaistSizeTrendChartClient } from "./WaistSizeTrendChartClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ruler, PlusCircle } from "lucide-react"; // Changed icon to Ruler
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";

export function WaistSizeTrackingCard() {
  const { bodyMeasurementLogs, logWaistSize } = useAppContext();
  const [currentWaistSize, setCurrentWaistSize] = useState("");
  const { toast } = useToast();

  console.log("WaistSizeTrackingCard - bodyMeasurementLogs:", JSON.stringify(bodyMeasurementLogs, null, 2));

  const handleLogWaistSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const waistValue = parseFloat(currentWaistSize);
    if (!isNaN(waistValue) && waistValue > 0) {
      logWaistSize(waistValue);
      setCurrentWaistSize("");
      toast({
        title: "Waist Size Logged!",
        description: `Your waist size of ${waistValue} cm has been recorded.`,
        variant: "default",
        className: "bg-accent text-accent-foreground",
      });
    } else {
      toast({
        title: "Invalid Waist Size",
        description: "Please enter a valid positive number for waist size.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Waist Size Tracking</CardTitle>
          <Ruler className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>Monitor your waist size (cm) over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleLogWaistSizeSubmit} className="space-y-3">
          <div>
            <Label htmlFor="waist-size-input">Current Waist Size (cm)</Label>
            <div className="flex space-x-2">
              <Input
                id="waist-size-input"
                type="number"
                step="0.1"
                placeholder="e.g., 85.5"
                value={currentWaistSize}
                onChange={(e) => setCurrentWaistSize(e.target.value)}
                min="0"
              />
              <Button type="submit" size="icon" aria-label="Log Waist Size">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Waist Size Trend</h3>
          <WaistSizeTrendChartClient bodyMeasurementLogs={bodyMeasurementLogs} />
        </div>
      </CardContent>
    </Card>
  );
}
