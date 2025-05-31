
'use server';
/**
 * @fileOverview Searches for food products using the Open Food Facts API and returns a list of items with their nutritional data.
 * Results are filtered to prioritize "whole foods" by excluding items with no calories, >5 ingredients, or from common fast-food brands.
 * Remaining results are sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
 *
 * - searchFoodProducts - Fetches a list of food products.
 * - SearchFoodProductsInput - Input type for searchFoodProducts.
 * - SearchFoodProductsOutput - Output type for searchFoodProducts, containing a list of products or an error.
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
  "costco", "nestle", "unilever", "pepsi", "coca-cola", "kraft", // Added some major food corp brands
  "general mills", "kellogg's", "monster energy", "red bull" // Added more
];

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  const encodedSearchTerm = encodeURIComponent(input.foodName);
  // Requesting specific fields to reduce payload size
  const fieldsToFetch = [
    "code", "product_name", "product_name_en", "generic_name", "brands",
    "nutriments", "ingredients_n", "ingredients_text_en", // Added ingredients_text_en for fallback
    "energy-kcal_100g", "fat_100g", "saturated-fat_100g", "trans-fat_100g",
    "monounsaturated-fat_100g", "polyunsaturated-fat_100g",
    "carbohydrates_100g", "sugars_100g", "proteins_100g", "fiber_100g"
  ].join(',');
  
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedSearchTerm}&search_simple=1&action=process&json=1&page_size=50&sort_by=popularity_key&fields=${fieldsToFetch}`; // Increased page_size for more initial results to filter

  try {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'MyHealthCompanionApp/1.0 (Web; +https://myhealthcompanion.com/contact)'
        }
    });

    if (!response.ok) {
      console.error('Open Food Facts API request failed:', response.status, response.statusText);
      const responseText = await response.text().catch(() => "Could not retrieve error body");
      return { products: [], error: `API Error: ${response.status} ${response.statusText}. Body: ${responseText.substring(0, 200)}` };
    }

    const data = await response.json();

    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from the API.` };
    }

    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    data.products.forEach((p: any, index: number) => {
      if (!(p && typeof p === 'object' && p.code && p.nutriments && typeof p.nutriments === 'object')) {
        return; 
      }

      // 1. Filter by calorie information (must exist)
      const calories = getNutrient(p.nutriments, 'energy-kcal_100g');
      if (calories === null) {
        return; 
      }

      const originalProductName = p.product_name || p.product_name_en || p.generic_name || "";
      const lowerProductName = originalProductName.toLowerCase();
      
      // Basic relevance: product name must contain the search query
      if (!originalProductName || !lowerProductName.includes(lowerFoodNameQuery)) {
        return; 
      }
      
      // 2. Filter by ingredient count (max 5)
      const numIngredients = p.ingredients_n;
      if (typeof numIngredients === 'number' && numIngredients > 5) {
        return;
      }
      // Fallback: if ingredients_n not present, check length of ingredients_text if available (approximate)
      // This is a rough heuristic as ingredients_text can be long for other reasons.
      // else if (!numIngredients && p.ingredients_text_en && p.ingredients_text_en.split(',').length > 7) { // Example: 7 as a slightly higher threshold for text
      //   return;
      // }


      // 3. Filter by brand names (exclude common fast-food/restaurant brands)
      const productBrands = p.brands;
      if (productBrands && typeof productBrands === 'string') {
        const lowerProductBrands = productBrands.toLowerCase();
        for (const excludedBrand of EXCLUDED_BRAND_KEYWORDS) {
          if (lowerProductBrands.includes(excludedBrand)) {
            return; // Exclude this product
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
          calories, // Already checked not null
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
        return a._apiPopularityIndex - b._apiPopularityIndex; // Tie-break with original API order (within the filtered results)
    });
    
    const finalResults: ProductSearchResultItem[] = tempResults.map(item => ({
        id: item.id,
        displayName: item.displayName,
        nutritionData: item.nutritionData,
    })).slice(0, 20); // Limit final results to a manageable number, e.g., 20


    if (finalResults.length === 0) {
        return { products: [], error: `No products matching your criteria were found for "${input.foodName}" after filtering.` };
    }

    return { products: finalResults };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts flow:', error); 

    if (error instanceof TypeError && (error.message === 'fetch failed' || (error.cause instanceof Error && error.cause.message.includes('ECONNREFUSED')))) {
      let causeMessage = "Network request to Open Food Facts API failed.";
      if (error.cause instanceof Error) { 
        causeMessage += ` This might be due to a network connectivity issue (e.g., ${error.cause.message}) from your current environment.`;
      } else if (error.cause) { 
        causeMessage += ` Specific cause: ${String(error.cause)}.`;
      }
      causeMessage += " If you are running in a simulator, virtual machine, or restricted network environment, please check its network access capabilities for external APIs like world.openfoodfacts.org.";
      return { products: [], error: causeMessage };
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
    return { products: [], error: `Flow Error: ${detail}` };
  }
}

