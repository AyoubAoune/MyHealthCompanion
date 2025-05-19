
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-meals.ts';
import '@/ai/flows/get-food-nutrition-flow.ts'; // This file now handles search and provides detailed nutrition for multiple items
import '@/ai/flows/suggest-meal-from-ingredients.ts';
