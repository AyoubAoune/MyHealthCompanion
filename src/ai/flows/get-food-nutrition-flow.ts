
'use server';
/**
 * @fileOverview Searches for food products using the Edamam Food Database API and returns a list of items with their nutritional data.
 * Results are sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
 *
 * - searchFoodProducts - Fetches a list of food products.
 * - SearchFoodProductsInput - Input type for searchFoodProducts.
 * - SearchFoodProductsOutput - Output type for searchFoodProducts, containing a list of products or an error, and API timing info.
 */

import { z } from 'zod';
import type { BaseNutritionData, ProductSearchResultItem } from '@/components/app/my-health-companion/types';

const SearchFoodProductsInputSchema = z.object({
  foodName: z.string().describe('The name of the food item to search for.'),
});
export type SearchFoodProductsInput = z.infer<typeof SearchFoodProductsInputSchema>;

// Zod schema for BaseNutritionData
const NutritionDataSchema = z.object({
  calories: z.number().nullable().describe('Calories (kcal) per 100g'),
  fat: z.number().nullable().describe('Total fat (g) per 100g'),
  healthyFats: z.number().nullable().describe('Sum of Monounsaturated and Polyunsaturated fats (g) per 100g.'),
  unhealthyFats: z.number().nullable().describe('Sum of Saturated and Trans fats (g) per 100g.'),
  carbs: z.number().nullable().describe('Carbohydrates (g) per 100g'),
  sugar: z.number().nullable().describe('Sugars (g) per 100g'),
  protein: z.number().nullable().describe('Protein (g) per 100g'),
  fiber: z.number().nullable().describe('Fiber (g) per 100g'),
  sourceName: z.string().nullable().describe('Name of the food item as identified by the API source.'),
});

// Zod schema for ProductSearchResultItem
const ProductSearchResultItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  nutritionData: NutritionDataSchema,
});

const SearchFoodProductsOutputSchema = z.object({
  products: z.array(ProductSearchResultItemSchema).describe("A list of found food products with their nutritional information, sorted by relevance."),
  error: z.string().optional().describe("An error message if the search failed or no products were found."),
  apiFetchDurationMs: z.number().optional().describe("Time taken for the API fetch call in milliseconds."),
  jsonParseDurationMs: z.number().optional().describe("Time taken for JSON parsing of the API response in milliseconds."),
  processingDurationMs: z.number().optional().describe("Time taken for internal filtering and sorting of products in milliseconds."),
});
export type SearchFoodProductsOutput = z.infer<typeof SearchFoodProductsOutputSchema>;


const getNutrientValue = (nutrients: any, key: string): number | null => {
  const nutrient = nutrients[key];
  if (nutrient && typeof nutrient.quantity === 'number' && isFinite(nutrient.quantity)) {
    return parseFloat(nutrient.quantity.toFixed(2)); // Keep two decimal places
  }
  if (typeof nutrient === 'number' && isFinite(nutrient)) { // Edamam sometimes returns direct numbers
    return parseFloat(nutrient.toFixed(2));
  }
  return null;
};

interface TempProductSearchResultItem extends ProductSearchResultItem {
  _sortPriority: number;
  _apiOriginalIndex: number; // To maintain some original order as tie-breaker
}

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;

  if (!appId || !appKey || appId === 'your_edamam_app_id' || appKey === 'your_edamam_app_key') {
    console.error('Edamam API credentials not configured in .env file.');
    return {
      products: [],
      error: 'Food database API credentials are not configured. Please set EDAMAM_APP_ID and EDAMAM_APP_KEY in your .env file.',
    };
  }

  const encodedSearchTerm = encodeURIComponent(input.foodName);
  // Edamam's parser endpoint is good for natural language queries.
  // `nutrition-type=logging` is for general purpose food logging.
  const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodedSearchTerm}&nutrition-type=logging`;

  let apiFetchDurationMs: number | undefined;
  let jsonParseDurationMs: number | undefined;
  let processingDurationMs: number | undefined;

  try {
    const startTime = Date.now();
    console.log(`[searchFoodProducts Edamam] Fetching (term: "${input.foodName}"): ${url.substring(0, url.indexOf('app_key='))}app_key=HIDDEN...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const fetchEndTime = Date.now();
    apiFetchDurationMs = fetchEndTime - startTime;
    console.log(`[searchFoodProducts Edamam] API fetch took ${apiFetchDurationMs} ms. Status: ${response.status}`);

    if (!response.ok) {
      console.error('Edamam API request failed:', response.status, response.statusText);
      const responseText = await response.text().catch(() => "Could not retrieve error body");
      let errorDetail = `API Error: ${response.status} ${response.statusText}.`;
      if (response.status === 401 || response.status === 403) {
        errorDetail += " This might be due to invalid or missing API credentials for Edamam.";
      } else {
        errorDetail += ` Body: ${responseText.substring(0, 200)}`;
      }
      return { products: [], error: errorDetail, apiFetchDurationMs };
    }

    const responseText = await response.text();
    const jsonParseStartTime = Date.now();
    const data = JSON.parse(responseText);
    const jsonParseEndTime = Date.now();
    jsonParseDurationMs = jsonParseEndTime - jsonParseStartTime;
    console.log(`[searchFoodProducts Edamam] JSON parsing took ${jsonParseDurationMs} ms.`);

    const totalApiAndParseTime = (apiFetchDurationMs || 0) + (jsonParseDurationMs || 0);
    console.log(`[searchFoodProducts Edamam] Total API + JSON parsing time: ${totalApiAndParseTime} ms.`);

    const edamamResults = data.hints || []; // `hints` is the array of results for general queries
                                           // `parsed` is usually for specific ingredient analysis

    if (!edamamResults || !Array.isArray(edamamResults) || edamamResults.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from Edamam.`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const processingStartTime = Date.now();
    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    edamamResults.forEach((item: any, index: number) => {
      const food = item.food;
      if (!(food && food.foodId && food.label && food.nutrients)) {
        return;
      }

      const calories = getNutrientValue(food.nutrients, 'ENERC_KCAL');
      // Edamam results usually have calories, but good to check.
      if (calories === null || calories === 0) {
         return;
      }

      const originalProductName = food.label;
      const lowerProductName = originalProductName.toLowerCase();

      // Basic check: does the item label contain the search query?
      // Edamam's relevance scoring is usually good, but this is a fallback.
      if (!lowerProductName.includes(lowerFoodNameQuery)) {
        // return; // Keep this commented for now, Edamam's relevance might be better.
      }

      const totalFat = getNutrientValue(food.nutrients, 'FAT');
      const saturatedFat = getNutrientValue(food.nutrients, 'FASAT'); // Saturated
      const transFat = getNutrientValue(food.nutrients, 'FATRN');     // Trans
      const monounsaturatedFat = getNutrientValue(food.nutrients, 'FAMS'); // Monounsaturated
      const polyunsaturatedFat = getNutrientValue(food.nutrients, 'FAPU'); // Polyunsaturated

      let calculatedHealthyFats: number | null = null;
      if (monounsaturatedFat !== null || polyunsaturatedFat !== null) {
        calculatedHealthyFats = (monounsaturatedFat ?? 0) + (polyunsaturatedFat ?? 0);
      }

      let calculatedUnhealthyFats: number | null = null;
      if (saturatedFat !== null || transFat !== null) {
        calculatedUnhealthyFats = (saturatedFat ?? 0) + (transFat ?? 0);
      }

      const carbs = getNutrientValue(food.nutrients, 'CHOCDF'); // Total Carbohydrate, by difference
      const sugar = getNutrientValue(food.nutrients, 'SUGAR');    // Total Sugars
      const protein = getNutrientValue(food.nutrients, 'PROCNT'); // Protein
      const fiber = getNutrientValue(food.nutrients, 'FIBTG');   // Fiber, total dietary

      const displayName = food.label;

      let sortPriority: number;
      if (lowerProductName === lowerFoodNameQuery) {
        sortPriority = 0; // Exact match
      } else if (lowerProductName.startsWith(lowerFoodNameQuery)) {
        sortPriority = 1; // Starts with query
      } else if (lowerProductName.includes(lowerFoodNameQuery)){ // Ensure it contains query if not exact or startsWith
        sortPriority = 2; // Contains query
      } else {
        sortPriority = 3; // Does not directly contain (should be rare with Edamam's relevance)
      }

      tempResults.push({
        id: food.foodId,
        displayName: displayName,
        nutritionData: {
          calories,
          fat: totalFat,
          healthyFats: calculatedHealthyFats,
          unhealthyFats: calculatedUnhealthyFats,
          carbs,
          sugar,
          protein,
          fiber,
          sourceName: displayName,
        },
        _sortPriority: sortPriority,
        _apiOriginalIndex: index,
      });
    });

    tempResults.sort((a, b) => {
      if (a._sortPriority !== b._sortPriority) {
        return a._sortPriority - b._sortPriority;
      }
      return a._apiOriginalIndex - b._apiOriginalIndex; // Fallback to original API order
    });

    const finalResults: ProductSearchResultItem[] = tempResults
      .map(item => ({
        id: item.id,
        displayName: item.displayName,
        nutritionData: item.nutritionData,
      }))
      .slice(0, 20); // Cap final display results to 20

    const processingEndTime = Date.now();
    processingDurationMs = processingEndTime - processingStartTime;
    console.log(`[searchFoodProducts Edamam] Data processing (mapping, sorting) took ${processingDurationMs} ms.`);

    if (finalResults.length === 0) {
      return { products: [], error: `No products matching your criteria were found for "${input.foodName}" from Edamam after processing.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
    }

    return { products: finalResults, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts (Edamam) flow:', error);

    let detail = 'An unexpected error occurred while processing food data using Edamam API.';
    if (error instanceof Error) {
      detail = error.message;
      if (error.cause) {
        detail += ` Cause: ${String(error.cause)}`;
      }
    } else if (typeof error === 'string') {
      detail = error;
    }
    return { products: [], error: `Flow Error: ${detail}`, apiFetchDurationMs, jsonParseDurationMs };
  }
}
