
export interface UserSettings {
  name: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyFiberTarget: number;
  reminderTime: string; // e.g., "09:00"
  remindersEnabled: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  foodItem?: string; // Name of the food logged
  calories: number;
  protein: number;
  fiber: number;
  fat?: number;
  healthyFats?: number; // Monounsaturated + Polyunsaturated
  unhealthyFats?: number; // Saturated + Trans
  carbs?: number;
  sugar?: number;
}

export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number; // in kg or preferred unit
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
