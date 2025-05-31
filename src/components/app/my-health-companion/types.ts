
export interface UserSettings {
  name: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyFiberTarget: number;
  reminderTime: string; // e.g., "09:00"
  remindersEnabled: boolean;
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
  totalFat: number; // Changed to non-optional, default 0
  totalHealthyFats: number; // Changed to non-optional, default 0
  totalUnhealthyFats: number; // Changed to non-optional, default 0
  totalCarbs: number; // Changed to non-optional, default 0
  totalSugar: number; // Changed to non-optional, default 0
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
  sourceName: string | null; // Name of the food item from the API or as selected by user
}

export interface ProductSearchResultItem {
  id: string; // API product code
  displayName: string;
  nutritionData: BaseNutritionData;
}

// Checklist Types
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  // category: 'todo' | 'avoid'; // Future use for 'Things to Avoid'
}

export interface DailyChecklist {
  date: string; // YYYY-MM-DD, to ensure daily reset
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

// New BodyMeasurementLog for waist size and potentially other measurements
export interface BodyMeasurementLog {
  date: string; // YYYY-MM-DD
  waistSizeCm?: number | null;
  // Future: hipSizeCm?: number | null;
  // Future: neckSizeCm?: number | null;
}
