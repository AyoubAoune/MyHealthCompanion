
'use server';
/**
 * @fileOverview Searches for food products using the USDA FoodData Central API and returns a list of items with their nutritional data.
 * Results are sorted to prioritize exact matches, then "starts with" matches, then "contains" matches.
 *
 * - searchFoodProducts - Fetches a list of food products using USDA FoodData Central.
 * - SearchFoodProductsInput - Input type for searchFoodProducts.
 * - SearchFoodProductsOutput - Output type for searchFoodProducts, containing a list of products or an error, and API timing info.
 */

import { z } from 'zod';
import type { BaseNutritionData, ProductSearchResultItem } from '@/components/app/my-health-companion/types';

const USDA_API_KEY = process.env.USDA_API_KEY;

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

// Nutrient IDs from USDA FoodData Central
const NUTRIENT_IDS = {
  CALORIES: 1008, // Energy in kcal
  PROTEIN: 1003,
  FAT: 1004, // Total lipid (fat)
  CARBS: 1005, // Carbohydrate, by difference
  FIBER: 1079, // Fiber, total dietary
  SUGARS: 2000, // Sugars, total including NLEA (this is a common one, matches `SUGAR.added` in some contexts, but often the main one)
  SATURATED_FAT: 1258, // Fatty acids, total saturated
  MONOUNSATURATED_FAT: 1292, // Fatty acids, total monounsaturated
  POLYUNSATURATED_FAT: 1293, // Fatty acids, total polyunsaturated
  TRANS_FAT: 1257, // Fatty acids, total trans
};


export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  let apiFetchDurationMs: number | undefined;
  let jsonParseDurationMs: number | undefined;
  let processingDurationMs: number | undefined;

  if (!USDA_API_KEY) {
    console.error("USDA API Key (USDA_API_KEY) is missing. Please check your .env file.");
    return { 
      products: [], 
      error: "Server configuration error: USDA API Key missing. Please add USDA_API_KEY to your .env file.",
    };
  }

  const encodedSearchTerm = encodeURIComponent(input.foodName);
  // Increased pageSize to get more results for better filtering potential.
  // Using generalSearchInput for broader matching.
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodedSearchTerm}&pageSize=50&dataType=SR%20Legacy,Foundation,Branded`;
  
  try {
    const startTime = Date.now();
    console.log(`[searchFoodProducts USDA] Fetching (term: "${input.foodName}"): ${url.replace(USDA_API_KEY, 'USDA_API_KEY_REDACTED')}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    const fetchEndTime = Date.now();
    apiFetchDurationMs = fetchEndTime - startTime;
    console.log(`[searchFoodProducts USDA] API fetch took ${apiFetchDurationMs} ms. Status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('USDA API request failed:', response.status, response.statusText, errorBody);
      return { products: [], error: `USDA API Error: ${response.status} ${response.statusText}. ${errorBody}`, apiFetchDurationMs };
    }
    
    const responseText = await response.text();
    const jsonParseStartTime = Date.now();
    const data = JSON.parse(responseText);
    const jsonParseEndTime = Date.now();
    jsonParseDurationMs = jsonParseEndTime - jsonParseStartTime;
    console.log(`[searchFoodProducts USDA] JSON parsing took ${jsonParseDurationMs} ms.`);

    const processingStartTime = Date.now();
    
    const usdaFoods = data.foods || []; 
    if (!usdaFoods || usdaFoods.length === 0) {
      return { products: [], error: `No products found for "${input.foodName}" from USDA FoodData Central.`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    usdaFoods.forEach((item: any, index: number) => {
      const getNutrientValue = (nutrientId: number): number | null => {
        const nutrient = item.foodNutrients?.find((n: any) => n.nutrient && (n.nutrient.id === nutrientId || n.nutrientId === nutrientId || n.nutrientNumber == nutrientId.toString() ));
        // For Energy (Calories), USDA API might use unit "kJ" sometimes, ensure "kcal" or convert.
        // For this version, assuming 'kcal' is directly available or primary.
        // The 'amount' field is new in FDC API v1 for some nutrient objects
        const value = nutrient ? (nutrient.value ?? nutrient.amount) : undefined; 
        return (value !== undefined && !isNaN(parseFloat(value))) ? parseFloat(value) : null;
      };

      const calories = getNutrientValue(NUTRIENT_IDS.CALORIES);
      if (calories === null || calories <= 0) {
        return; // Skip if no valid calorie data
      }

      const originalProductName = item.description || "Unknown Product";
      const lowerProductName = originalProductName.toLowerCase();
      
      const protein = getNutrientValue(NUTRIENT_IDS.PROTEIN);
      const fat = getNutrientValue(NUTRIENT_IDS.FAT);
      const carbs = getNutrientValue(NUTRIENT_IDS.CARBS);
      const fiber = getNutrientValue(NUTRIENT_IDS.FIBER);
      const sugar = getNutrientValue(NUTRIENT_IDS.SUGARS);
      
      const saturatedFat = getNutrientValue(NUTRIENT_IDS.SATURATED_FAT);
      const transFat = getNutrientValue(NUTRIENT_IDS.TRANS_FAT);
      const monounsaturatedFat = getNutrientValue(NUTRIENT_IDS.MONOUNSATURATED_FAT);
      const polyunsaturatedFat = getNutrientValue(NUTRIENT_IDS.POLYUNSATURATED_FAT);
      
      let healthyFats: number | null = null;
      if (monounsaturatedFat !== null || polyunsaturatedFat !== null) {
        healthyFats = (monounsaturatedFat ?? 0) + (polyunsaturatedFat ?? 0);
      }

      let unhealthyFats: number | null = null;
      if (saturatedFat !== null || transFat !== null) {
        unhealthyFats = (saturatedFat ?? 0) + (transFat ?? 0);
      }
      
      const nutritionData: BaseNutritionData = {
        calories,
        protein,
        fat,
        healthyFats,
        unhealthyFats,
        carbs,
        sugar,
        fiber,
        sourceName: originalProductName,
      };

      let sortPriority: number;
      if (lowerProductName === lowerFoodNameQuery) {
        sortPriority = 0; // Exact match
      } else if (lowerProductName.startsWith(lowerFoodNameQuery)) {
        sortPriority = 1; // Starts with query
      } else if (lowerProductName.includes(lowerFoodNameQuery)) {
        sortPriority = 2; // Contains query
      } else {
        // This case should ideally not happen if USDA search is good, but as a fallback
        if (!originalProductName.toLowerCase().includes(lowerFoodNameQuery)) return; 
        sortPriority = 3; 
      }
      
      tempResults.push({
        id: item.fdcId?.toString() || `usda-${Date.now()}-${index}`,
        displayName: originalProductName,
        nutritionData: nutritionData,
        _sortPriority: sortPriority,
        _apiOriginalIndex: index, // USDA results often have their own relevance score
      });
    });

    tempResults.sort((a, b) => {
      if (a._sortPriority !== b._sortPriority) {
        return a._sortPriority - b._sortPriority;
      }
      // For items with the same sort priority, attempt to use their original index from the API
      // as a tie-breaker, assuming USDA already sorts by some relevance.
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
    console.log(`[searchFoodProducts USDA] Data processing (filtering, mapping, sorting) took ${processingDurationMs} ms.`);

    if (finalResults.length === 0) {
        return { products: [], error: `No suitable products found for "${input.foodName}" after processing USDA results. Try a broader search term.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
    }

    return { products: finalResults, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts (USDA) flow:', error);
    
    let detail = 'An unexpected error occurred while processing food data using USDA API.';
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
