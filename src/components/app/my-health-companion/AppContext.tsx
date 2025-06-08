
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserSettings, DailyLog, WeightLog, BodyMeasurementLog, LoggedEntry, DailyChecklist, ChecklistItem } from './types';
import { DEFAULT_USER_SETTINGS, DEFAULT_DAILY_LOG_BASE, DEFAULT_DAILY_CHECKLIST_ITEMS } from './types';
import { getCurrentDateFormatted } from './date-utils';

interface AppContextType {
  userSettings: UserSettings;
  dailyLogs: DailyLog[];
  weightLogs: WeightLog[];
  bodyMeasurementLogs: BodyMeasurementLog[];
  dailyChecklist: DailyChecklist | null;
  currentDayLog: DailyLog | null;
  isLoading: boolean;
  updateUserSettings: (newSettingsOrUpdater: Partial<UserSettings> | ((prevSettings: UserSettings) => Partial<UserSettings>)) => void;
  logIntake: (entryData: Omit<LoggedEntry, 'id'>) => void;
  logQuickCalories: (calories: number) => void; // New function for quick calorie logging
  logWeight: (weight: number) => void;
  logWaistSize: (waistCm: number) => void;
  toggleChecklistItem: (itemId: string) => void;
  claimReward: (prizeCost: number) => boolean;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialDailyLogs = useMemo(() => [], []);
  const initialWeightLogs = useMemo(() => [], []);
  const initialBodyMeasurementLogs = useMemo(() => [], []);
  const todayStr = getCurrentDateFormatted();

  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>("myhealthcompanion-settings", DEFAULT_USER_SETTINGS);
  const [dailyLogs, setDailyLogs] = useLocalStorage<DailyLog[]>("myhealthcompanion-dailylogs", initialDailyLogs);
  const [weightLogs, setWeightLogs] = useLocalStorage<WeightLog[]>("myhealthcompanion-weightlogs", initialWeightLogs);
  const [bodyMeasurementLogs, setBodyMeasurementLogs] = useLocalStorage<BodyMeasurementLog[]>(
    "myhealthcompanion-bodymeasurements", 
    initialBodyMeasurementLogs
  ); 
  
  const [dailyChecklist, setDailyChecklist] = useLocalStorage<DailyChecklist | null>(
    `myhealthcompanion-checklist-${todayStr}`, 
    null 
  );

  const [currentDayLog, setCurrentDayLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
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

      if (!dailyChecklist || dailyChecklist.date !== todayStr) {
        setDailyChecklist({
          date: todayStr,
          items: DEFAULT_DAILY_CHECKLIST_ITEMS.map(item => ({ ...item, completed: false })),
        });
      }
    }
  }, [dailyLogs, isLoading, todayStr, dailyChecklist, setDailyChecklist]);


  const updateUserSettings = useCallback((newSettingsOrUpdater: Partial<UserSettings> | ((prevSettings: UserSettings) => Partial<UserSettings>)) => {
    if (typeof newSettingsOrUpdater === 'function') {
      setUserSettings(prev => ({ ...prev, ...newSettingsOrUpdater(prev) }));
    } else {
      setUserSettings(prev => ({ ...prev, ...newSettingsOrUpdater }));
    }
  }, [setUserSettings]);

  const updateDailyLogTotals = (log: DailyLog): DailyLog => {
    const updatedLog = { ...log };
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
    return updatedLog;
  };

  const logIntake = useCallback((entryData: Omit<LoggedEntry, 'id'>) => {
    const currentTodayStr = getCurrentDateFormatted();
    setDailyLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === currentTodayStr);
      let logToUpdate: DailyLog;

      if (existingLogIndex > -1) {
        logToUpdate = { ...prevLogs[existingLogIndex] };
      } else {
        logToUpdate = { date: currentTodayStr, ...DEFAULT_DAILY_LOG_BASE };
      }

      const newEntry: LoggedEntry = {
        ...entryData,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      };
      logToUpdate.entries = [...logToUpdate.entries, newEntry];
      
      const finalUpdatedLog = updateDailyLogTotals(logToUpdate);
      
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = finalUpdatedLog;
        return updatedLogs;
      }
      return [...prevLogs, finalUpdatedLog];
    });
  }, [setDailyLogs]);

  const logQuickCalories = useCallback((calories: number) => {
    const currentTodayStr = getCurrentDateFormatted();
    setDailyLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === currentTodayStr);
      let logToUpdate: DailyLog;

      if (existingLogIndex > -1) {
        logToUpdate = { ...prevLogs[existingLogIndex] };
      } else {
        logToUpdate = { date: currentTodayStr, ...DEFAULT_DAILY_LOG_BASE };
      }

      const quickEntry: LoggedEntry = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Shorter random part
        foodItemName: "Quick Calorie Entry",
        mealType: "Snack", // Default or decide if this should be selectable
        quantity: 1, // Represents 1 entry
        calories: calories,
        protein: 0,
        fiber: 0,
        fat: 0,
        healthyFats: 0,
        unhealthyFats: 0,
        carbs: 0,
        sugar: 0,
      };
      logToUpdate.entries = [...logToUpdate.entries, quickEntry];

      const finalUpdatedLog = updateDailyLogTotals(logToUpdate);

      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = finalUpdatedLog;
        return updatedLogs;
      }
      return [...prevLogs, finalUpdatedLog];
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

  const logWaistSize = useCallback((waistCm: number) => {
    const currentTodayStr = getCurrentDateFormatted();
    setBodyMeasurementLogs(prevLogs => {
      const existingLogIndex = prevLogs.findIndex(log => log.date === currentTodayStr);
      if (existingLogIndex > -1) {
        const updatedLogs = [...prevLogs];
        updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], date: currentTodayStr, waistSizeCm: waistCm };
        return updatedLogs;
      }
      return [...prevLogs, { date: currentTodayStr, waistSizeCm: waistCm }];
    });
  }, [setBodyMeasurementLogs]);

  const toggleChecklistItem = useCallback((itemId: string) => {
    let itemChangedToCompleted = false;
    let itemChangedToIncomplete = false;

    setDailyChecklist(prevChecklist => {
      if (!prevChecklist) return null;

      const originalItem = prevChecklist.items.find(item => item.id === itemId);
      if (!originalItem) return prevChecklist;

      const updatedItems = prevChecklist.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      
      const updatedItem = updatedItems.find(item => item.id === itemId);
      if (updatedItem) {
        if (updatedItem.completed && !originalItem.completed) {
          itemChangedToCompleted = true;
        } else if (!updatedItem.completed && originalItem.completed) {
          itemChangedToIncomplete = true;
        }
      }
      return { ...prevChecklist, items: updatedItems };
    });

    if (itemChangedToCompleted) {
      updateUserSettings(prevSettings => ({
        ...prevSettings,
        totalRewardPoints: (prevSettings.totalRewardPoints || 0) + 1,
      }));
    } else if (itemChangedToIncomplete) {
      updateUserSettings(prevSettings => ({
        ...prevSettings,
        totalRewardPoints: Math.max(0, (prevSettings.totalRewardPoints || 0) - 1),
      }));
    }
  }, [setDailyChecklist, updateUserSettings]);

  const claimReward = useCallback((prizeCost: number): boolean => {
    if (userSettings.totalRewardPoints >= prizeCost) {
      updateUserSettings(prevSettings => ({
        ...prevSettings,
        totalRewardPoints: prevSettings.totalRewardPoints - prizeCost,
      }));
      return true;
    }
    return false;
  }, [userSettings.totalRewardPoints, updateUserSettings]);

  const resetAllData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        "myhealthcompanion-settings",
        "myhealthcompanion-dailylogs",
        "myhealthcompanion-weightlogs",
        "myhealthcompanion-bodymeasurements",
      ];
      keysToRemove.forEach(key => window.localStorage.removeItem(key));

      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith("myhealthcompanion-checklist-")) {
          window.localStorage.removeItem(key);
        }
      });
      
      window.location.reload();
    }
  }, []);

  const contextValue = {
    userSettings,
    dailyLogs,
    weightLogs,
    bodyMeasurementLogs,
    dailyChecklist,
    currentDayLog,
    isLoading,
    updateUserSettings,
    logIntake,
    logQuickCalories, // Expose new function
    logWeight,
    logWaistSize,
    toggleChecklistItem,
    claimReward,
    resetAllData,
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
