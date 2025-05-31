
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserSettings, DailyLog, WeightLog, LoggedEntry, MealType, DailyChecklist, ChecklistItem } from './types';
import { DEFAULT_USER_SETTINGS, DEFAULT_DAILY_LOG_BASE, DEFAULT_DAILY_CHECKLIST_ITEMS } from './types';
import { getCurrentDateFormatted } from './date-utils';

interface AppContextType {
  userSettings: UserSettings;
  dailyLogs: DailyLog[];
  weightLogs: WeightLog[];
  dailyChecklist: DailyChecklist | null;
  currentDayLog: DailyLog | null;
  isLoading: boolean;
  updateUserSettings: (newSettings: Partial<UserSettings>) => void;
  logIntake: (entryData: Omit<LoggedEntry, 'id'>) => void;
  logWeight: (weight: number) => void;
  toggleChecklistItem: (itemId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialDailyLogs = useMemo(() => [], []);
  const initialWeightLogs = useMemo(() => [], []);
  const todayStr = getCurrentDateFormatted(); // Get today's date once

  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>("myhealthcompanion-settings", DEFAULT_USER_SETTINGS);
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>("myhealthcompanion-dailylogs", initialDailyLogs);
  const [weightLogs, setWeightLogs] = useLocalStorage<WeightLog[]>("myhealthcompanion-weightlogs", initialWeightLogs);
  
  // For daily checklist, key includes the date for daily reset
  const [dailyChecklist, setDailyChecklist] = useLocalStorage<DailyChecklist | null>(
    `myhealthcompanion-checklist-${todayStr}`, 
    null // Start with null, initialize in useEffect
  );

  const [currentDayLog, setCurrentDayLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Initialize or load current day's log
      const foundLog = dailyLogs.find(log => log.date === todayStr);
      let currentLogToSet: DailyLog;
      if (foundLog) {
        currentLogToSet = {
          ...DEFAULT_DAILY_LOG_BASE,
          ...foundLog,
          date: foundLog.date,
          entries: foundLog.entries || [],
        };
      } else {
        currentLogToSet = { date: todayStr, ...DEFAULT_DAILY_LOG_BASE };
      }
      setCurrentDayLog(currentLogToSet);

      // Initialize or load current day's checklist
      if (!dailyChecklist || dailyChecklist.date !== todayStr) {
        // If no checklist for today, or if loaded checklist is for a past date (from stale localStorage), create a new one.
        setDailyChecklist({
          date: todayStr,
          items: DEFAULT_DAILY_CHECKLIST_ITEMS.map(item => ({ ...item, completed: false })), // Ensure items are reset
        });
      }
    }
  }, [dailyLogs, isLoading, todayStr, dailyChecklist, setDailyChecklist]); // Added dailyChecklist and setDailyChecklist to dependencies


  const updateUserSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  }, [setUserSettings]);

  const logIntake = useCallback((entryData: Omit<LoggedEntry, 'id'>) => {
    const currentTodayStr = getCurrentDateFormatted(); // Get fresh date in case of day change
    setDailyLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === currentTodayStr);
      let updatedLog: DailyLog;

      if (existingLogIndex > -1) {
        updatedLog = { ...prevLogs[existingLogIndex] };
      } else {
        updatedLog = { date: currentTodayStr, ...DEFAULT_DAILY_LOG_BASE };
      }

      const newEntry: LoggedEntry = {
        ...entryData,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      };
      updatedLog.entries = [...updatedLog.entries, newEntry];

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
    const currentTodayStr = getCurrentDateFormatted();
    setWeightLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === currentTodayStr);
      if(existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = { date: currentTodayStr, weight };
        return updatedLogs;
      }
      return [...prevLogs, { date: currentTodayStr, weight }];
    });
  }, [setWeightLogs]);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setDailyChecklist(prevChecklist => {
      if (!prevChecklist) return null;
      const updatedItems = prevChecklist.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      return { ...prevChecklist, items: updatedItems };
    });
  }, [setDailyChecklist]);

  const contextValue = {
    userSettings,
    dailyLogs,
    weightLogs,
    dailyChecklist,
    currentDayLog,
    isLoading,
    updateUserSettings,
    logIntake,
    logWeight,
    toggleChecklistItem,
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
