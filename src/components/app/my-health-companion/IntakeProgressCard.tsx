
"use client";

import type { DailyLog, UserSettings } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Beef, Leaf } from "lucide-react";
import { useAppContext } from "./AppContext";

export function IntakeProgressCard() {
  const { currentDayLog, userSettings } = useAppContext();
  const intake = currentDayLog || { calories: 0, protein: 0, fiber: 0, date: '' };

  const calorieProgress = userSettings.dailyCalorieTarget > 0 ? (intake.calories / userSettings.dailyCalorieTarget) * 100 : 0;
  const proteinProgress = userSettings.dailyProteinTarget > 0 ? (intake.protein / userSettings.dailyProteinTarget) * 100 : 0;
  const fiberProgress = userSettings.dailyFiberTarget > 0 ? (intake.fiber / userSettings.dailyFiberTarget) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Today's Progress</CardTitle>
        <CardDescription>Your intake for today against your daily goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressItem
          icon={Flame}
          label="Calories"
          consumed={intake.calories}
          target={userSettings.dailyCalorieTarget}
          progressValue={calorieProgress}
          unit="kcal"
        />
        <ProgressItem
          icon={Beef}
          label="Protein"
          consumed={intake.protein}
          target={userSettings.dailyProteinTarget}
          progressValue={proteinProgress}
          unit="g"
        />
        <ProgressItem
          icon={Leaf}
          label="Fiber"
          consumed={intake.fiber}
          target={userSettings.dailyFiberTarget}
          progressValue={fiberProgress}
          unit="g"
        />
      </CardContent>
    </Card>
  );
}

interface ProgressItemProps {
  icon: React.ElementType;
  label: string;
  consumed: number;
  target: number;
  progressValue: number;
  unit: string;
}

function ProgressItem({ icon: Icon, label, consumed, target, progressValue, unit }: ProgressItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(consumed)} / {target} {unit}
        </span>
      </div>
      <Progress value={Math.min(progressValue, 100)} aria-label={`${label} progress`} className="h-3 [&>div]:bg-primary" />
    </div>
  );
}
