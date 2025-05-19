
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserSettings, DailyLog, WeightLog, LoggedEntry, MealType } from './types';
import { DEFAULT_USER_SETTINGS, DEFAULT_DAILY_LOG_BASE } from './types';
import { getCurrentDateFormatted } from './date-utils';

interface AppContextType {
  userSettings: UserSettings;
  dailyLogs: DailyLog[];
  weightLogs: WeightLog[];
  currentDayLog: DailyLog | null;
  isLoading: boolean;
  updateUserSettings: (newSettings: Partial<UserSettings>) => void;
  logIntake: (entryData: Omit<LoggedEntry, 'id'>) => void;
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
      
      let currentLogToSet: DailyLog;

      if (foundLog) {
        // Migration for old structure or ensure new structure is complete
        if (!(foundLog as DailyLog).entries) { // Check if it's the old structure
          const oldLog = foundLog as any; // Cast to access old fields
          currentLogToSet = {
            date: oldLog.date,
            entries: [], // Old logs won't have individual entries
            totalCalories: oldLog.calories || 0,
            totalProtein: oldLog.protein || 0,
            totalFiber: oldLog.fiber || 0,
            totalFat: oldLog.fat || 0,
            totalHealthyFats: oldLog.healthyFats || 0,
            totalUnhealthyFats: oldLog.unhealthyFats || 0,
            totalCarbs: oldLog.carbs || 0,
            totalSugar: oldLog.sugar || 0,
          };
        } else {
          // It's the new structure, ensure all total fields are present
          currentLogToSet = {
            ...DEFAULT_DAILY_LOG_BASE, // Provide defaults for any missing total fields
            ...foundLog, // Spread the found log
            date: foundLog.date, // Ensure date is explicitly set
            entries: foundLog.entries || [], // Ensure entries is an array
          };
        }
      } else {
        // New day, new log structure
        currentLogToSet = {
          date: todayStr,
          ...DEFAULT_DAILY_LOG_BASE,
        };
      }
      setCurrentDayLog(currentLogToSet);
    }
  }, [dailyLogs, isLoading]);


  const updateUserSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  }, [setUserSettings]);

  const logIntake = useCallback((entryData: Omit<LoggedEntry, 'id'>) => {
    const todayStr = getCurrentDateFormatted();
    setDailyLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === todayStr);
      
      let updatedLog: DailyLog;

      if (existingLogIndex > -1) {
        updatedLog = { ...prevLogs[existingLogIndex] };
        if (!updatedLog.entries) { // Migration for safety, though useEffect should handle it
            updatedLog.entries = [];
            updatedLog.totalCalories = (updatedLog as any).calories || 0;
            // ... copy other old total fields if necessary
        }
      } else {
        updatedLog = { date: todayStr, ...DEFAULT_DAILY_LOG_BASE };
      }

      const newEntry: LoggedEntry = {
        ...entryData,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 15), // More unique ID
      };
      updatedLog.entries = [...updatedLog.entries, newEntry];

      // Recalculate totals
      updatedLog.totalCalories = 0;
      updatedLog.totalProtein = 0;
      updatedLog.totalFiber = 0;
      updatedLog.totalFat = 0;
      updatedLog.totalHealthyFats = 0;
      updatedLog.totalUnhealthyFats = 0;
      updatedLog.totalCarbs = 0;
      updatedLog.totalSugar = 0;

      for (const entry of updatedLog.entries) {
        updatedLog.totalCalories += entry.calories || 0;
        updatedLog.totalProtein += entry.protein || 0;
        updatedLog.totalFiber += entry.fiber || 0;
        updatedLog.totalFat += entry.fat || 0;
        updatedLog.totalHealthyFats += entry.healthyFats || 0;
        updatedLog.totalUnhealthyFats += entry.unhealthyFats || 0;
        updatedLog.totalCarbs += entry.carbs || 0;
        updatedLog.totalSugar += entry.sugar || 0;
      }
      
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = updatedLog;
        return updatedLogs;
      }
      return [...prevLogs, updatedLog];
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
