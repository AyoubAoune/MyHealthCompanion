
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserSettings, DailyLog, WeightLog } from './types';
import { DEFAULT_USER_SETTINGS } from './types';
import { getCurrentDateFormatted } from './date-utils';

interface AppContextType {
  userSettings: UserSettings;
  dailyLogs: DailyLog[];
  weightLogs: WeightLog[];
  currentDayLog: DailyLog | null;
  isLoading: boolean;
  updateUserSettings: (newSettings: Partial<UserSettings>) => void;
  logIntake: (intake: Omit<DailyLog, 'date'>) => void;
  logWeight: (weight: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialDailyLogs = useMemo(() => [], []);
  const initialWeightLogs = useMemo(() => [], []);

  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>("myhealthcompanion-settings", DEFAULT_USER_SETTINGS);
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>("myhealthcompanion-dailylogs", initialDailyLogs);
  const [weightLogs, setWeightLogs] = useLocalStorage<WeightLog[]>("myhealthcompanion-weightlogs", initialWeightLogs);
  const [currentDayLog, setCurrentDayLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const todayStr = getCurrentDateFormatted();
      const foundLog = dailyLogs.find(log => log.date === todayStr);
      const defaultLogBase: DailyLog = {
        date: todayStr, calories: 0, protein: 0, fiber: 0,
        fat: 0, healthyFats: 0, unhealthyFats: 0, carbs: 0, sugar: 0,
      };
      setCurrentDayLog(foundLog || defaultLogBase);
    }
  }, [dailyLogs, isLoading]);

  const updateUserSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  }, [setUserSettings]);

  const logIntake = useCallback((newIntake: Omit<DailyLog, 'date'>) => {
    const todayStr = getCurrentDateFormatted();
    setDailyLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === todayStr);
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        const existingLog = updatedLogs[existingLogIndex];
        
        updatedLogs[existingLogIndex] = {
          ...existingLog,
          foodItem: newIntake.foodItem ? (existingLog.foodItem ? `${existingLog.foodItem}, ${newIntake.foodItem}` : newIntake.foodItem) : existingLog.foodItem,
          calories: (existingLog.calories || 0) + (newIntake.calories || 0),
          protein: (existingLog.protein || 0) + (newIntake.protein || 0),
          fiber: (existingLog.fiber || 0) + (newIntake.fiber || 0),
          fat: (existingLog.fat || 0) + (newIntake.fat || 0),
          healthyFats: (existingLog.healthyFats || 0) + (newIntake.healthyFats || 0),
          unhealthyFats: (existingLog.unhealthyFats || 0) + (newIntake.unhealthyFats || 0),
          carbs: (existingLog.carbs || 0) + (newIntake.carbs || 0),
          sugar: (existingLog.sugar || 0) + (newIntake.sugar || 0),
        };
        return updatedLogs;
      }
      // Ensure all fields are present even for new logs
      const defaultLogBase: DailyLog = {
        date: todayStr, calories: 0, protein: 0, fiber: 0,
        fat: 0, healthyFats: 0, unhealthyFats: 0, carbs: 0, sugar: 0,
      };
      return [...prevLogs, { ...defaultLogBase, ...newIntake, date: todayStr }];
    });
  }, [setDailyLogs]);

  const logWeight = useCallback((weight: number) => {
    const todayStr = getCurrentDateFormatted();
    setWeightLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === todayStr);
      if(existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = { date: todayStr, weight };
        return updatedLogs;
      }
      return [...prevLogs, { date: todayStr, weight }];
    });
  }, [setWeightLogs]);

  const contextValue = {
    userSettings,
    dailyLogs,
    weightLogs,
    currentDayLog,
    isLoading,
    updateUserSettings,
    logIntake,
    logWeight,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
