
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
  CALORIES: 1008, // Energy in kcal (Corresponds to nutrientNumber "208")
  PROTEIN: 1003,  // (Corresponds to nutrientNumber "203")
  FAT: 1004,      // Total lipid (fat) (Corresponds to nutrientNumber "204")
  CARBS: 1005,    // Carbohydrate, by difference (Corresponds to nutrientNumber "205")
  FIBER: 1079,    // Fiber, total dietary (Corresponds to nutrientNumber "291")
  SUGARS: 2000,   // Sugars, total including NLEA (Corresponds to nutrientNumber "269") - Note: This specific ID might not always be present for all food items.
  SATURATED_FAT: 1258, // Fatty acids, total saturated (Corresponds to nutrientNumber "606")
  MONOUNSATURATED_FAT: 1292, // Fatty acids, total monounsaturated (Corresponds to nutrientNumber "645")
  POLYUNSATURATED_FAT: 1293, // Fatty acids, total polyunsaturated (Corresponds to nutrientNumber "646")
  TRANS_FAT: 1257, // Fatty acids, total trans (Corresponds to nutrientNumber "605") - Note: Trans fat data can be sparse.
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
  // Using generalSearchInput for broader matching. Requesting multiple data types.
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
      console.log(`[searchFoodProducts USDA] No foods array in response or empty for term: "${input.foodName}"`);
      return { products: [], error: `No raw food data returned from USDA for "${input.foodName}".`, apiFetchDurationMs, jsonParseDurationMs };
    }

    const tempResults: TempProductSearchResultItem[] = [];
    const lowerFoodNameQuery = input.foodName.toLowerCase();

    usdaFoods.forEach((item: any, index: number) => {
      const getNutrientValue = (nutrientIdToFind: number): number | null => {
        const nutrient = item.foodNutrients?.find((n: any) => {
          if (n.nutrientId === nutrientIdToFind) return true; // e.g. 1008
          if (n.nutrient && n.nutrient.id === nutrientIdToFind) return true; // Check nested structure if present
          // nutrientNumber is a string in API response (e.g. "208" for Calories), nutrientIdToFind is number (e.g. 1008)
          // So direct comparison n.nutrientNumber == nutrientIdToFind or n.nutrientNumber == nutrientIdToFind.toString() is not what we want for mapping.
          // We map our internal NUTRIENT_IDS (which are FDC nutrient IDs) to the ones in the response.
          return false;
        });
        
        const value = nutrient ? (nutrient.value ?? nutrient.amount) : undefined;
        if (value !== undefined && !isNaN(parseFloat(value))) {
          let numericValue = parseFloat(value);
          // Convert kJ to kcal for Calories if necessary
          if (nutrientIdToFind === NUTRIENT_IDS.CALORIES && nutrient.unitName === 'KJ') {
            numericValue = numericValue / 4.184;
          }
          return numericValue;
        }
        return null;
      };

      const calories = getNutrientValue(NUTRIENT_IDS.CALORIES);
      if (calories === null || calories <= 0) {
        // console.log(`[searchFoodProducts USDA] Skipping item "${item.description}" due to missing or zero calories.`);
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
        // This case should ideally not happen if USDA search is good & item.description contains the query,
        // but added as a fallback. Check if item.description actually contains the query term if we reach here.
        if (!originalProductName.toLowerCase().includes(lowerFoodNameQuery)) {
            // console.log(`[searchFoodProducts USDA] Skipping item "${originalProductName}" as it doesn't include query "${lowerFoodNameQuery}" after primary sort checks.`);
            return; 
        }
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
    console.log(`[searchFoodProducts USDA] Data processing (filtering, mapping, sorting) took ${processingDurationMs} ms. Found ${finalResults.length} suitable products.`);

    if (finalResults.length === 0) {
        return { products: [], error: `No products matching criteria found for "${input.foodName}" after processing USDA results. Try a broader search term or check if items had calorie data.`, apiFetchDurationMs, jsonParseDurationMs, processingDurationMs };
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
