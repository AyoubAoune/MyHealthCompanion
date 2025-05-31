
'use server';
/**
 * @fileOverview Searches for food products using the Open Food Facts API and returns a list of items with their nutritional data.
 * Results are filtered to prioritize "whole foods" by excluding items with no calories, >5 ingredients, or from common fast-food brands.
 * Remaining results are sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
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


const getNutrient = (nutriments: any, key: string): number | null => {
  let val = nutriments[key];
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    const parsedVal = parseFloat(val.replace(',', '.'));
    val = isNaN(parsedVal) ? null : parsedVal;
  }
  return typeof val === 'number' && isFinite(val) ? val : null;
};

interface TempProductSearchResultItem extends ProductSearchResultItem {
  _sortPriority: number;
  _apiPopularityIndex: number;
}

const EXCLUDED_BRAND_KEYWORDS: string[] = [
  "mcdonald's", "subway", "burger king", "kfc", "starbucks", 
  "domino's", "pizza hut", "taco bell", "wendy's", "dunkin", 
  "costco", "nestle", "unilever", "pepsi", "coca-cola", "kraft",
  "general mills", "kellogg's", "monster energy", "red bull", "carl's jr",
  "dairy queen", "tim hortons", "popeyes", "chipotle", "panda express",
  "heinz", "mars", "mondelez", "danone", "ferrero", "dr pepper snapple",
  "frito-lay", "cadbury", "lindt", "haribo", "ritter sport", "milka",
  "pringles", "oreo", "lays", "doritos", "cheetos", "tostitos",
  "ben & jerry's", "haagen-dazs", "magnum", "kitkat", "snickers", "twix",
  "baskin robbins", "cold stone creamery", "ihop", "denny's", "applebee's",
  "chili's", "olive garden", "red lobster", "outback steakhouse", "tgi fridays",
  "panera bread", "au bon pain", "pret a manger"
];

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  const encodedSearchTerm = encodeURIComponent(input.foodName);
  const fieldsToFetch = [
    "code", "product_name", "product_name_en", "generic_name", "brands",
    "nutriments", "ingredients_n", // ingredients_text_en can be very large, skip for now
    "energy-kcal_100g", "fat_100g", "saturated-fat_100g", "trans-fat_100g",
    "monounsaturated-fat_100g", "polyunsaturated-fat_100g",
    "carbohydrates_100g", "sugars_100g", "proteins_100g", "fiber_100g"
  ].join(',');
  
  const pageSize = 25; // Reduced page size
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedSearchTerm}&search_simple=1&action=process&json=1&page_size=${pageSize}&sort_by=popularity_key&fields=${fieldsToFetch}`;

  let apiFetchDurationMs: number | undefined;
  let jsonParseDurationMs: number | undefined;
  let processingDurationMs: number | undefined;

  try {
    const startTime = Date.now();
    console.log(`[searchFoodProducts] Fetching (page_size: ${pageSize}, term: "${input.foodName}"): ${url}`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'MyHealthCompanionApp/1.0 (Web; +https://myhealthcompanion.com/contact)'
        }
    });

    const fetchEndTime = Date.now();
    apiFetchDurationMs = fetchEndTime - startTime;
    console.log(`[searchFoodProducts] API fetch took ${apiFetchDurationMs} ms. Status: ${response.status}`);

    if (!response.ok) {
      console.error('Open Food Facts API request failed:', response.status, response.statusText);
      const responseText = await response.text().catch(() => "Could not retrieve error body");
      return { products: [], error: `API Error: ${response.status} ${response.statusText}. Body: ${responseText.substring(0, 200)}`, apiFetchDurationMs };
    }

    const responseText = await response.text();
    const jsonParseStartTime = Date.now();
    const data = JSON.parse(responseText);
    const jsonParseEndTime = Date.now();
    jsonParseDurationMs = jsonParseEndTime - jsonParseStartTime;
    console.log(`[searchFoodProducts] JSON parsing took ${jsonParseDurationMs} ms.`);
    
    const totalApiAndParseTime = (apiFetchDurationMs || 0) + (jsonParseDurationMs || 0);
    console.log(`[searchFoodProducts] Total API + JSON parsing time: ${totalApiAndParseTime} ms.`);


    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from the API.`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const processingStartTime = Date.now();
    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    data.products.forEach((p: any, index: number) => {
      if (!(p && typeof p === 'object' && p.code && p.nutriments && typeof p.nutriments === 'object')) {
        return; 
      }

      const calories = getNutrient(p.nutriments, 'energy-kcal_100g');
      if (calories === null || calories === 0) { // Exclude items with no calories or zero calories
        return; 
      }

      const originalProductName = p.product_name || p.product_name_en || p.generic_name || "";
      const lowerProductName = originalProductName.toLowerCase();
      
      if (!originalProductName || !lowerProductName.includes(lowerFoodNameQuery)) {
        return; 
      }
      
      const numIngredients = p.ingredients_n;
      if (typeof numIngredients === 'number' && numIngredients > 5) {
        return;
      }

      const productBrands = p.brands;
      if (productBrands && typeof productBrands === 'string') {
        const lowerProductBrands = productBrands.toLowerCase();
        for (const excludedBrand of EXCLUDED_BRAND_KEYWORDS) {
          if (lowerProductBrands.includes(excludedBrand)) {
            return; 
          }
        }
      }
            
      const nutriments = p.nutriments;
      const fat = getNutrient(nutriments, 'fat_100g');
      const saturatedFat = getNutrient(nutriments, 'saturated-fat_100g');
      const transFat = getNutrient(nutriments, 'trans-fat_100g');
      const monounsaturatedFat = getNutrient(nutriments, 'monounsaturated-fat_100g');
      const polyunsaturatedFat = getNutrient(nutriments, 'polyunsaturated-fat_100g');
      
      let calculatedHealthyFats: number | null = null;
      if (monounsaturatedFat !== null || polyunsaturatedFat !== null) {
        calculatedHealthyFats = (monounsaturatedFat ?? 0) + (polyunsaturatedFat ?? 0);
      }
      
      let calculatedUnhealthyFats: number | null = null;
      if (saturatedFat !== null || transFat !== null) {
        calculatedUnhealthyFats = (saturatedFat ?? 0) + (transFat ?? 0);
      }

      const carbs = getNutrient(nutriments, 'carbohydrates_100g');
      const sugar = getNutrient(nutriments, 'sugars_100g');
      const protein = getNutrient(nutriments, 'proteins_100g');
      const fiber = getNutrient(nutriments, 'fiber_100g');
      
      const displayName = originalProductName || "Unknown Product";

      let sortPriority: number;
      if (lowerProductName === lowerFoodNameQuery) {
        sortPriority = 0; // Exact match
      } else if (lowerProductName.startsWith(lowerFoodNameQuery)) {
        sortPriority = 1; // Starts with query
      } else {
        sortPriority = 2; // Contains query
      }

      tempResults.push({
        id: p.code.toString(),
        displayName: displayName,
        nutritionData: {
          calories, 
          fat,
          healthyFats: calculatedHealthyFats,
          unhealthyFats: calculatedUnhealthyFats,
          carbs,
          sugar,
          protein,
          fiber,
          sourceName: displayName,
        },
        _sortPriority: sortPriority,
        _apiPopularityIndex: index, 
      });
    });

    tempResults.sort((a, b) => {
        if (a._sortPriority !== b._sortPriority) {
            return a._sortPriority - b._sortPriority;
        }
        return a._apiPopularityIndex - b._apiPopularityIndex; 
    });
    
    const finalResults: ProductSearchResultItem[] = tempResults.map(item => ({
        id: item.id,
        displayName: item.displayName,
        nutritionData: item.nutritionData,
    })).slice(0, 20); // Still cap final display results


    const processingEndTime = Date.now();
    processingDurationMs = processingEndTime - processingStartTime;
    console.log(`[searchFoodProducts] Data processing (filtering, sorting) took ${processingDurationMs} ms.`);

    if (finalResults.length === 0) {
        return { products: [], error: `No products matching your criteria were found for "${input.foodName}" after filtering.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
    }

    return { products: finalResults, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts flow:', error); 

    // Improved error handling for network issues
    if (error instanceof TypeError && (error.message === 'fetch failed' || (error.cause instanceof Error && error.cause.message.includes('ECONNREFUSED')))) {
      let causeMessage = "Network request to Open Food Facts API failed.";
      if (error.cause instanceof Error) { 
        causeMessage += ` This might be due to a network connectivity issue (e.g., ${error.cause.message}) from your current environment.`;
      } else if (error.cause) { 
        causeMessage += ` Specific cause: ${String(error.cause)}.`;
      }
      causeMessage += " If you are running in a simulator, virtual machine, or restricted network environment, please check its network access capabilities for external APIs like world.openfoodfacts.org.";
      return { products: [], error: causeMessage, apiFetchDurationMs, jsonParseDurationMs };
    }
    
    let detail = 'An unexpected error occurred while processing food data.';
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

