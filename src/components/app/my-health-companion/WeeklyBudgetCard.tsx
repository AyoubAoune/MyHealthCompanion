
"use client";

import { isWithinInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import { getWeekRange, parseDate, getCurrentDateFormatted } from "./date-utils";


export function WeeklyBudgetCard() {
  const { dailyLogs, userSettings } = useAppContext();
  const [weeklyCaloriesConsumed, setWeeklyCaloriesConsumed] = useState(0);
  const [weeklyBudget, setWeeklyBudget] = useState(0);

  useEffect(() => {
    const today = parseDate(getCurrentDateFormatted()); // Ensure today is based on formatted string for consistency
    const { start, end } = getWeekRange(today);
    
    const currentWeekLogs = dailyLogs.filter(log => {
      const logDate = parseDate(log.date);
      return isWithinInterval(logDate, { start, end });
    });

    const consumed = currentWeekLogs.reduce((sum, log) => sum + log.calories, 0);
    setWeeklyCaloriesConsumed(consumed);
    setWeeklyBudget(userSettings.dailyCalorieTarget * 7);

  }, [dailyLogs, userSettings.dailyCalorieTarget]);


  const remainingBudget = weeklyBudget - weeklyCaloriesConsumed;
  const progressPercentage = weeklyBudget > 0 ? (weeklyCaloriesConsumed / weeklyBudget) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Weekly Calorie Budget</CardTitle>
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>
          Track your calorie intake for the current week (Monday - Sunday).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Total Weekly Budget:</p>
          <p className="text-2xl font-bold text-primary">{weeklyBudget.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
        </div>
        <div>
          <p className="text-sm font-medium">Consumed This Week:</p>
          <p className="text-lg font-semibold">{weeklyCaloriesConsumed.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
        </div>
        <div>
          <p className="text-sm font-medium">Remaining Budget:</p>
          <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-destructive' : 'text-accent-foreground'}`}>
            {remainingBudget.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kcal</span>
          </p>
        </div>
        <div className="pt-2">
          <Progress value={Math.min(progressPercentage, 100)} aria-label="Weekly calorie budget progress" className="h-3 [&>div]:bg-accent" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {Math.round(Math.min(progressPercentage, 100))}% of weekly budget used
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
