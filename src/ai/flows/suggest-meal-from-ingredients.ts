
'use server';

/**
 * @fileOverview Provides a meal suggestion based on user-provided ingredients.
 *
 * - suggestMealFromIngredients - A function that generates a meal suggestion from ingredients.
 * - SuggestMealFromIngredientsInput - The input type for the suggestMealFromIngredients function.
 * - SuggestedMealFromIngredientsOutput - The return type for the suggestMealFromIngredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealFromIngredientsInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list or free-form text of ingredients the user has available. Example: "eggs, cheese, spinach, tomatoes"'),
  mealType: z
    .string()
    .optional()
    .describe('The desired type of meal, e.g., "Breakfast", "Lunch", "Dinner", "Snack", or "Any". If "Any" or empty, suggest based on ingredients primarily.'),
  dietaryPreferences: z
    .string()
    .optional()
    .describe(
      'Any dietary preferences or restrictions, e.g., "vegetarian", "gluten-free", "low-carb". Can be empty.'
    ),
});
export type SuggestMealFromIngredientsInput = z.infer<typeof SuggestMealFromIngredientsInputSchema>;

// Using a similar structure to MealItem for consistency
const SuggestedMealSchema = z.object({
  name: z.string().describe('The name or title of the suggested meal. Example: "Spinach and Cheese Omelette"'),
  description: z.string().describe('A description of the meal, including a simple list of steps on how to prepare it using the provided ingredients. Example: "A quick and healthy omelette. Whisk eggs, add chopped spinach and cheese. Cook in a pan until set. Serve with a side of tomatoes."'),
  calories: z.string().optional().describe('Approximate calorie count for the meal as a string. Example: "Approximately 300 calories" or "About 350 kcal"'),
  ingredientsUsed: z.array(z.string()).optional().describe('A list of the primary ingredients from the input that were used in the suggestion.')
});
export type SuggestedMealFromIngredientsOutput = z.infer<typeof SuggestedMealSchema>;


export async function suggestMealFromIngredients(input: SuggestMealFromIngredientsInput): Promise<SuggestedMealFromIngredientsOutput> {
  return suggestMealFromIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealFromIngredientsPrompt',
  input: {schema: SuggestMealFromIngredientsInputSchema},
  output: {schema: SuggestedMealSchema},
  prompt: `You are a creative chef that helps users come up with meal ideas based on ingredients they have on hand.
User's Available Ingredients: {{{ingredients}}}
Desired Meal Type: {{#if mealType}}{{{mealType}}}{{else}}Any suitable meal{{/if}}
Dietary Preferences/Restrictions: {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}None specified{{/if}}

Your task is to suggest ONE meal.
Prioritize using the ingredients provided by the user. You can assume common pantry staples like salt, pepper, basic oils unless specified as unavailable.
If essential ingredients are missing for a typical meal, you can state that or suggest a very simple preparation.

Provide the meal suggestion with the following details:
- "name": The name of the meal.
- "description": A brief description of the meal. CRITICALLY IMPORTANT: Include simple, step-by-step preparation instructions within this description.
- "calories": (Optional) An approximate calorie count for the meal, as a string (e.g., "Approximately 350 calories").
- "ingredientsUsed": (Optional) A list of the key ingredients from the user's input that you incorporated into your suggestion.

Output EXACTLY a single JSON object matching this structure. Do not include any introductory text, numbering, or any other text outside of the main JSON object.

Example of the exact output format:
{
  "name": "Quick Tomato and Spinach Scramble",
  "description": "A fast and easy scramble. Heat a pan with a little oil. Add spinach and chopped tomatoes, cook until spinach wilts. Pour in whisked eggs seasoned with salt and pepper. Scramble until cooked to your liking. Uses: eggs, spinach, tomatoes.",
  "calories": "Approximately 280 calories",
  "ingredientsUsed": ["eggs", "spinach", "tomatoes"]
}
`,
});

const suggestMealFromIngredientsFlow = ai.defineFlow(
  {
    name: 'suggestMealFromIngredientsFlow',
    inputSchema: SuggestMealFromIngredientsInputSchema,
    outputSchema: SuggestedMealSchema, // Expecting a single meal object
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        console.error("Meal from ingredients flow did not receive valid output from the prompt.");
        // Return a default error-like structure if the AI fails to provide valid JSON
        return {
            name: "Suggestion Error",
            description: "Could not generate a meal suggestion at this time. The AI might have had trouble with the request or ingredients list.",
        };
    }
    // The output should already be parsed by Genkit based on the outputSchema.
    return output;
  }
);
