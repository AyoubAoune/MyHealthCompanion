
'use server';
/**
 * @fileOverview Searches for food products using the Open Food Facts API and returns a list of items with their nutritional data.
 * Results are filtered for "whole foods" and sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
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

interface TempProductSearchResultItem extends ProductSearchResultItem {
  _sortPriority: number;
  _apiOriginalIndex: number; 
}

const EXCLUDED_BRAND_KEYWORDS = [
    "mcdonald's", "subway", "burger king", "kfc", "starbucks", "pizza hut",
    "domino's", "taco bell", "wendy's", "nescafe", "nestle", "coca-cola",
    "pepsi", "lays", "doritos", "pringles", "oreo", "cadbury", "mars", "heinz",
    "kellogg's", "general mills", "kraft", "unilever", "procter & gamble"
];
const MAX_INGREDIENTS_FOR_WHOLE_FOOD = 5;

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  const encodedSearchTerm = encodeURIComponent(input.foodName);
  const fieldsToFetch = [
    "code", "product_name", "product_name_en", "brands",
    "nutriments.energy-kcal_100g", "nutriments.fat_100g",
    "nutriments.saturated-fat_100g", "nutriments.monounsaturated-fat_100g",
    "nutriments.polyunsaturated-fat_100g", "nutriments.trans-fat_100g",
    "nutriments.carbohydrates_100g", "nutriments.sugars_100g",
    "nutriments.proteins_100g", "nutriments.fiber_100g",
    "ingredients_n", "ingredients_text"
  ].join(',');

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedSearchTerm}&search_simple=1&action=process&json=1&page_size=25&fields=${fieldsToFetch}`;
  
  let apiFetchDurationMs: number | undefined;
  let jsonParseDurationMs: number | undefined;
  let processingDurationMs: number | undefined;

  try {
    const startTime = Date.now();
    console.log(`[searchFoodProducts OFF] Fetching (term: "${input.foodName}", page_size: 25): ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'MyHealthCompanionApp/1.0 - Web - myhealthcompanion.com (for education project, will not make excessive requests)' }
    });
    
    const fetchEndTime = Date.now();
    apiFetchDurationMs = fetchEndTime - startTime;
    console.log(`[searchFoodProducts OFF] API fetch took ${apiFetchDurationMs} ms. Status: ${response.status}`);

    if (!response.ok) {
      console.error('Open Food Facts API request failed:', response.status, response.statusText);
      return { products: [], error: `API Error: ${response.status} ${response.statusText}`, apiFetchDurationMs };
    }
    
    const responseText = await response.text();
    const jsonParseStartTime = Date.now();
    const data = JSON.parse(responseText);
    const jsonParseEndTime = Date.now();
    jsonParseDurationMs = jsonParseEndTime - jsonParseStartTime;
    console.log(`[searchFoodProducts OFF] JSON parsing took ${jsonParseDurationMs} ms.`);

    const totalApiAndParseTime = (apiFetchDurationMs || 0) + (jsonParseDurationMs || 0);
    console.log(`[searchFoodProducts OFF] Total API + JSON parsing time: ${totalApiAndParseTime} ms.`);

    if (!data.products || data.products.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from Open Food Facts.`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const processingStartTime = Date.now();
    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    data.products.forEach((product: any, index: number) => {
      const calories = product.nutriments?.["energy-kcal_100g"];
      if (calories === undefined || calories === null || isNaN(parseFloat(calories)) || parseFloat(calories) <= 0) {
        return; // Skip if no valid calorie data
      }

      const ingredientsCount = product.ingredients_n;
      if (ingredientsCount !== undefined && ingredientsCount > MAX_INGREDIENTS_FOR_WHOLE_FOOD) {
        return; // Skip if too many ingredients
      }

      const brands = product.brands?.toLowerCase() || "";
      if (EXCLUDED_BRAND_KEYWORDS.some(keyword => brands.includes(keyword))) {
        return; // Skip if brand is in excluded list
      }
      
      const originalProductName = product.product_name_en || product.product_name || "Unknown Product";
      const lowerProductName = originalProductName.toLowerCase();

      // Ensure product name contains the search query
      if (!lowerProductName.includes(lowerFoodNameQuery)) {
          return;
      }

      const getNutrient = (key: string): number | null => {
        const val = product.nutriments?.[key];
        return (val !== undefined && !isNaN(parseFloat(val))) ? parseFloat(val) : null;
      };
      
      const fat = getNutrient("fat_100g");
      const saturatedFat = getNutrient("saturated-fat_100g");
      const transFat = getNutrient("trans-fat_100g");
      const monounsaturatedFat = getNutrient("monounsaturated-fat_100g");
      const polyunsaturatedFat = getNutrient("polyunsaturated-fat_100g");
      
      let healthyFats: number | null = null;
      if (monounsaturatedFat !== null || polyunsaturatedFat !== null) {
        healthyFats = (monounsaturatedFat ?? 0) + (polyunsaturatedFat ?? 0);
      }

      let unhealthyFats: number | null = null;
      if (saturatedFat !== null || transFat !== null) {
        unhealthyFats = (saturatedFat ?? 0) + (transFat ?? 0);
      }

      const nutritionData: BaseNutritionData = {
        calories: parseFloat(calories),
        fat,
        healthyFats,
        unhealthyFats,
        carbs: getNutrient("carbohydrates_100g"),
        sugar: getNutrient("sugars_100g"),
        protein: getNutrient("proteins_100g"),
        fiber: getNutrient("fiber_100g"),
        sourceName: originalProductName,
      };

      let sortPriority: number;
      if (lowerProductName === lowerFoodNameQuery) {
        sortPriority = 0; // Exact match
      } else if (lowerProductName.startsWith(lowerFoodNameQuery)) {
        sortPriority = 1; // Starts with query
      } else {
        sortPriority = 2; // Contains query (already confirmed by earlier check)
      }
      
      tempResults.push({
        id: product.code || `custom-${Date.now()}-${index}`,
        displayName: originalProductName,
        nutritionData: nutritionData,
        _sortPriority: sortPriority,
        _apiOriginalIndex: index,
      });
    });

    tempResults.sort((a, b) => {
      if (a._sortPriority !== b._sortPriority) {
        return a._sortPriority - b._sortPriority;
      }
      // If Open Food Facts API provides a "popularity_key" or similar, we could use it here
      // For now, use original index as a fallback tie-breaker
      return a._apiOriginalIndex - b._apiOriginalIndex;
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
    console.log(`[searchFoodProducts OFF] Data processing (filtering, mapping, sorting) took ${processingDurationMs} ms.`);

    if (finalResults.length === 0) {
        return { products: [], error: `No suitable "whole food" products found for "${input.foodName}" after filtering. Try a broader search term.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
    }

    return { products: finalResults, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts (Open Food Facts) flow:', error);
    
    let detail = 'An unexpected error occurred while processing food data using Open Food Facts API.';
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
