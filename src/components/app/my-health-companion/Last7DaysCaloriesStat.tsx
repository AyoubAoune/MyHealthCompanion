
"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import { StatCard } from "./StatCard"; 
import { getLastNDaysFormatted } from "./date-utils";
import { BarChart } from "lucide-react";

export function Last7DaysCaloriesStat() {
  const { dailyLogs, userSettings } = useAppContext();
  const [totalCalories, setTotalCalories] = useState(0);
  const [averageCalories, setAverageCalories] = useState(0);
  const [daysWithLogs, setDaysWithLogs] = useState(0);

  useEffect(() => {
    const last7Days = getLastNDaysFormatted(7);
    let sumCalories = 0;
    let countDaysWithLogs = 0;

    last7Days.forEach(dateStr => {
      const log = dailyLogs.find(dlog => dlog.date === dateStr);
      if (log) {
        sumCalories += log.calories;
        if (log.calories > 0) { // Count day only if calories were logged
            countDaysWithLogs++;
        }
      }
    });

    setTotalCalories(sumCalories);
    setDaysWithLogs(countDaysWithLogs);
    setAverageCalories(countDaysWithLogs > 0 ? Math.round(sumCalories / countDaysWithLogs) : 0);

  }, [dailyLogs]);

  const targetMetPercentage = userSettings.dailyCalorieTarget > 0 && daysWithLogs > 0
    ? Math.round((averageCalories / userSettings.dailyCalorieTarget) * 100)
    : 0;

  return (
    <StatCard
      title="Last 7 Days Calories"
      icon={BarChart}
      className="shadow-lg"
      variant="accent"
    >
      <div className="text-sm text-muted-foreground mt-1">
        <p>Total Consumed: <span className="font-semibold text-accent-foreground">{totalCalories.toLocaleString()} kcal</span></p>
        <p>Average Daily: <span className="font-semibold text-accent-foreground">{averageCalories.toLocaleString()} kcal</span> (over {daysWithLogs} days with logs)</p>
        {daysWithLogs > 0 && userSettings.dailyCalorieTarget > 0 && (
          <p>
            Average is <span className="font-semibold text-accent-foreground">{targetMetPercentage}%</span> of your daily target ({userSettings.dailyCalorieTarget.toLocaleString()} kcal).
          </p>
        )}
         {daysWithLogs === 0 && (
          <p className="italic">No calorie logs found in the last 7 days.</p>
        )}
      </div>
    </StatCard>
  );
}
