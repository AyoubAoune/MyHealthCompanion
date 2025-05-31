
import type { LucideIcon } from 'lucide-react';
import { Cookie, IceCream, Utensils, CalendarCheck2, Trophy } from 'lucide-react';

export interface UserSettings {
  name: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyFiberTarget: number;
  reminderTime: string; // e.g., "09:00"
  remindersEnabled: boolean;
  totalRewardPoints: number; // New field for gamification
}

export const MEAL_TYPES = [
  "Breakfast", 
  "Morning Snack", 
  "Lunch", 
  "Afternoon Snack", 
  "Dinner", 
  "Late Snack"
] as const;

export type MealType = typeof MEAL_TYPES[number];

export interface LoggedEntry { // Represents one thing the user logged
  id: string; // unique ID for this specific logged entry
  foodItemName: string;
  mealType: MealType;
  quantity: number; // in grams, or serving size description if not by weight
  calories: number;
  protein: number;
  fiber: number;
  fat?: number;
  healthyFats?: number;
  unhealthyFats?: number;
  carbs?: number;
  sugar?: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  entries: LoggedEntry[]; // All individual food entries for the day

  // Aggregated totals for the day
  totalCalories: number;
  totalProtein: number;
  totalFiber: number;
  totalFat: number; 
  totalHealthyFats: number; 
  totalUnhealthyFats: number; 
  totalCarbs: number; 
  totalSugar: number; 
}


export interface MealSuggestionPreferences {
  calorieLimit: number;
  dietaryPreferences: string;
  avoidFoods: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  name: "User",
  dailyCalorieTarget: 2000,
  dailyProteinTarget: 75,
  dailyFiberTarget: 30,
  reminderTime: "09:00",
  remindersEnabled: false,
  totalRewardPoints: 0, // Initialize reward points
};

export const DEFAULT_DAILY_LOG_BASE: Omit<DailyLog, 'date'> = {
  entries: [],
  totalCalories: 0,
  totalProtein: 0,
  totalFiber: 0,
  totalFat: 0,
  totalHealthyFats: 0,
  totalUnhealthyFats: 0,
  totalCarbs: 0,
  totalSugar: 0,
};


// Represents the structure of nutritional data fetched from the API for 100g
export interface BaseNutritionData {
  calories: number | null;
  fat: number | null;
  healthyFats: number | null;
  unhealthyFats: number | null;
  carbs: number | null;
  sugar: number | null;
  protein: number | null;
  fiber: number | null;
  sourceName: string | null; 
}

export interface ProductSearchResultItem {
  id: string; 
  displayName: string;
  nutritionData: BaseNutritionData;
}

// Checklist Types
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyChecklist {
  date: string; 
  items: ChecklistItem[];
}

export const DEFAULT_DAILY_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'protein', text: 'Fuel with Protein Power', completed: false },
  { id: 'fiber', text: 'Fiber Up for Gut Health', completed: false },
  { id: 'meals', text: 'Nourish with Regular Meals', completed: false },
  { id: 'steps', text: 'Step into Wellness (5000+ steps)', completed: false },
  { id: 'water', text: 'Hydration Hero (Drink plenty of water)', completed: false },
  { id: 'movement', text: 'Mindful Movement Moment', completed: false },
];

// WeightLog remains the same
export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number; // in kg
}

// BodyMeasurementLog for waist size and potentially other measurements
export interface BodyMeasurementLog {
  date: string; // YYYY-MM-DD
  waistSizeCm?: number | null;
}

// Gamification: Prize Interface and Data
export interface Prize {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: React.ElementType; // Using React.ElementType for Lucide icons
}

export const PRIZES: Prize[] = [
  {
    id: 'snack',
    name: 'A Well-Deserved Snack',
    cost: 15,
    description: 'Enjoy a small, satisfying snack of your choice!',
    icon: Cookie,
  },
  {
    id: 'dessert',
    name: 'Delicious Dessert or Ice Cream',
    cost: 35,
    description: 'Treat yourself to a sweet dessert or a scoop of ice cream.',
    icon: IceCream,
  },
  {
    id: 'cheatmeal',
    name: 'Guilt-Free Cheat Meal',
    cost: 70,
    description: 'Indulge in one meal that\'s off your usual plan.',
    icon: Utensils,
  },
  {
    id: 'cheatday',
    name: 'Ultimate Cheat Day',
    cost: 140,
    description: 'Take a full day to relax your dietary rules and enjoy!',
    icon: CalendarCheck2,
  },
];
