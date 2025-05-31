
'use server';
/**
 * @fileOverview Searches for food products using the Edamam Food Database API and returns a list of items with their nutritional data.
 * Results are sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
 *
 * - searchFoodProducts - Fetches a list of food products using Edamam.
 * - SearchFoodProductsInput - Input type for searchFoodProducts.
 * - SearchFoodProductsOutput - Output type for searchFoodProducts, containing a list of products or an error, and API timing info.
 */

import { z } from 'zod';
import type { BaseNutritionData, ProductSearchResultItem } from '@/components/app/my-health-companion/types';

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

const SearchFoodProductsInputSchema = z.object({
  foodName: z.string().describe('The name of the food item to search for.'),
});
export type SearchFoodProductsInput = z.infer<typeof SearchFoodProductsInputSchema>;

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

interface TempProductSearchResultItem extends ProductSearchResultItem {
  _sortPriority: number;
  _apiOriginalIndex: number; 
}

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  let apiFetchDurationMs: number | undefined;
  let jsonParseDurationMs: number | undefined;
  let processingDurationMs: number | undefined;

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    console.error("Edamam API credentials (APP_ID or APP_KEY) are missing. Please check your .env file.");
    return { 
      products: [], 
      error: "Server configuration error: Edamam API credentials missing. Please contact support.",
    };
  }

  const encodedSearchTerm = encodeURIComponent(input.foodName);
  // Edamam's parser endpoint is generally good for single ingredients or simple dishes.
  // We request nutrition-type=logging to get detailed nutrients per 100g.
  const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${encodedSearchTerm}&nutrition-type=logging&category=generic-foods&category=packaged-foods`;
  
  try {
    const startTime = Date.now();
    console.log(`[searchFoodProducts Edamam] Fetching (term: "${input.foodName}"): ${url.replace(EDAMAM_APP_KEY, 'EDAMAM_APP_KEY_REDACTED')}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const fetchEndTime = Date.now();
    apiFetchDurationMs = fetchEndTime - startTime;
    console.log(`[searchFoodProducts Edamam] API fetch took ${apiFetchDurationMs} ms. Status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Edamam API request failed:', response.status, response.statusText, errorBody);
      return { products: [], error: `Edamam API Error: ${response.status} ${response.statusText}. ${errorBody}`, apiFetchDurationMs };
    }
    
    const responseText = await response.text();
    const jsonParseStartTime = Date.now();
    const data = JSON.parse(responseText);
    const jsonParseEndTime = Date.now();
    jsonParseDurationMs = jsonParseEndTime - jsonParseStartTime;
    console.log(`[searchFoodProducts Edamam] JSON parsing took ${jsonParseDurationMs} ms.`);

    const processingStartTime = Date.now();
    
    // Edamam returns hints which are often more useful than 'parsed' for a list of options
    const edamamProducts = data.hints || []; 
    if (!edamamProducts || edamamProducts.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from Edamam.`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    edamamProducts.forEach((item: any, index: number) => {
      const food = item.food;
      if (!food || !food.nutrients || food.nutrients.ENERC_KCAL === undefined || food.nutrients.ENERC_KCAL === null || food.nutrients.ENERC_KCAL <= 0) {
        return; // Skip if no valid calorie data
      }

      const originalProductName = food.label || "Unknown Product";
      const lowerProductName = originalProductName.toLowerCase();

      // Ensure product name contains the search query (Edamam usually does this, but good to double check)
      if (!lowerProductName.includes(lowerFoodNameQuery)) {
          return;
      }
      
      const nutrients = food.nutrients;
      const getNutrient = (key: string): number | null => {
        const val = nutrients[key];
        return (val !== undefined && !isNaN(parseFloat(val))) ? parseFloat(val) : null;
      };
      
      const saturatedFat = getNutrient("FASAT");
      const transFat = getNutrient("FATRN"); // May not always be present
      const monounsaturatedFat = getNutrient("FAMS");
      const polyunsaturatedFat = getNutrient("FAPU");
      
      let healthyFats: number | null = null;
      if (monounsaturatedFat !== null || polyunsaturatedFat !== null) {
        healthyFats = (monounsaturatedFat ?? 0) + (polyunsaturatedFat ?? 0);
      }

      let unhealthyFats: number | null = null;
      if (saturatedFat !== null || transFat !== null) {
        unhealthyFats = (saturatedFat ?? 0) + (transFat ?? 0);
      }

      const nutritionData: BaseNutritionData = {
        calories: getNutrient("ENERC_KCAL"),
        fat: getNutrient("FAT"),
        healthyFats,
        unhealthyFats,
        carbs: getNutrient("CHOCDF"), // Total carbohydrates
        sugar: getNutrient("SUGAR"),  // Total sugars
        protein: getNutrient("PROCNT"),
        fiber: getNutrient("FIBTG"),
        sourceName: originalProductName,
      };

      let sortPriority: number;
      if (lowerProductName === lowerFoodNameQuery) {
        sortPriority = 0; // Exact match
      } else if (lowerProductName.startsWith(lowerFoodNameQuery)) {
        sortPriority = 1; // Starts with query
      } else {
        sortPriority = 2; // Contains query
      }
      
      tempResults.push({
        id: food.foodId || `edamam-${Date.now()}-${index}`, // foodId is Edamam's unique ID
        displayName: originalProductName,
        nutritionData: nutritionData,
        _sortPriority: sortPriority,
        _apiOriginalIndex: index, // Edamam's results are typically sorted by relevance
      });
    });

    tempResults.sort((a, b) => {
      if (a._sortPriority !== b._sortPriority) {
        return a._sortPriority - b._sortPriority;
      }
      return a._apiOriginalIndex - b._apiOriginalIndex; // Fallback to Edamam's original order
    });
    
    const finalResults: ProductSearchResultItem[] = tempResults
        .map(item => ({
            id: item.id,
            displayName: item.displayName,
            nutritionData: item.nutritionData,
        }))
        .slice(0, 20); // Cap final display results

    const processingEndTime = Date.now();
    processingDurationMs = processingEndTime - processingStartTime;
    console.log(`[searchFoodProducts Edamam] Data processing (filtering, mapping, sorting) took ${processingDurationMs} ms.`);

    if (finalResults.length === 0) {
        return { products: [], error: `No suitable products found for "${input.foodName}" after processing Edamam results. Try a broader search term.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
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
