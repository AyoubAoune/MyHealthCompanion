
'use server';
/**
 * @fileOverview Searches for food products using the Open Food Facts API and returns a list of items with their nutritional data.
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
  products: z.array(ProductSearchResultItemSchema).describe("A list of found food products with their nutritional information."),
  error: z.string().optional().describe("An error message if the search failed or no products were found."),
});
export type SearchFoodProductsOutput = z.infer<typeof SearchFoodProductsOutputSchema>;


const getNutrient = (nutriments: any, key: string): number | null => {
  let val = nutriments[key];
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    // Replace comma with period for European decimal format, then parse
    const parsedVal = parseFloat(val.replace(',', '.'));
    val = isNaN(parsedVal) ? null : parsedVal;
  }
  return typeof val === 'number' && isFinite(val) ? val : null;
};

export async function searchFoodProducts(
  input: SearchFoodProductsInput
): Promise<SearchFoodProductsOutput> {
  const searchTerm = encodeURIComponent(input.foodName);
  // API already requests a page_size of 20
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${searchTerm}&search_simple=1&action=process&json=1&page_size=20&sort_by=popularity_key`;

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
      return { products: [], error: 'No products found for this search term.' };
    }

    const results: ProductSearchResultItem[] = [];
    let itemsIterated = 0; // Counter for raw items iterated from data.products

    for (const p of data.products) {
      if (itemsIterated >= 20) { // Strictly limit iteration to the first 20 raw products
          break;
      }
      itemsIterated++;

      // Ensure p is a valid object and has necessary fields
      if (p && typeof p === 'object' && p.code && (p.product_name || p.product_name_en || p.generic_name) && p.nutriments && typeof p.nutriments === 'object') {
        const nutriments = p.nutriments;

        const calories = getNutrient(nutriments, 'energy-kcal_100g');
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
        
        const displayName = p.product_name || p.product_name_en || p.generic_name || "Unknown Product";

        results.push({
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
            sourceName: displayName, // Using the same display name as sourceName for simplicity
          },
        });
      }
      // The condition `if (results.length >= 20) break;` is now implicitly handled
      // by `if (itemsIterated >= 20) break;` if all items are valid.
      // If some items are invalid, `results` might be less than 20, which is fine.
    }

    if (results.length === 0) {
        // This message is if products were returned by API, but none were processable by our criteria
        return { products: [], error: 'Found products, but none had sufficient data or a valid name that could be processed.' };
    }

    return { products: results };

  } catch (error: unknown) {
    console.error('Full error in searchFoodProducts flow:', error); 

    if (error instanceof TypeError && error.message === 'fetch failed') {
      let causeMessage = "Network request to Open Food Facts API failed.";
      // Check for specific error causes if available (Node.js often provides error.cause)
      if (error.cause instanceof Error) { 
        causeMessage += ` This might be due to a network connectivity issue (e.g., ECONNREFUSED, ENOTFOUND, DNS error) from your current environment. Specific cause: ${error.cause.message}.`;
      } else if (error.cause) { // Other potential cause structures
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
