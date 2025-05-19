
'use server';

/**
 * @fileOverview Provides multiple meal suggestions based on user-provided ingredients.
 *
 * - suggestMealsFromIngredients - A function that generates multiple meal suggestions from ingredients.
 * - SuggestMealsFromIngredientsInput - The input type for the suggestMealsFromIngredients function.
 * - SuggestMealsFromIngredientsOutput - The return type for the suggestMealsFromIngredients function, containing a list of meal suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealsFromIngredientsInputSchema = z.object({
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
export type SuggestMealsFromIngredientsInput = z.infer<typeof SuggestMealsFromIngredientsInputSchema>;

// Schema for a single suggested meal
const SuggestedMealItemSchema = z.object({
  name: z.string().describe('The name or title of the suggested meal. Example: "Spinach and Cheese Omelette"'),
  description: z.string().describe('A description of the meal, including a simple list of steps on how to prepare it using the provided ingredients. Example: "A quick and healthy omelette. Whisk eggs, add chopped spinach and cheese. Cook in a pan until set. Serve with a side of tomatoes."'),
  calories: z.string().optional().describe('Approximate calorie count for the meal as a string. Example: "Approximately 300 calories" or "About 350 kcal"'),
  ingredientsUsed: z.array(z.string()).optional().describe('A list of the primary ingredients from the input that were used in the suggestion.')
});
export type SuggestedMealItem = z.infer<typeof SuggestedMealItemSchema>;

// Schema for the output containing multiple meal suggestions
const SuggestMealsFromIngredientsOutputSchema = z.object({
  mealSuggestions: z.array(SuggestedMealItemSchema).describe('A list of up to 5 meal suggestion objects.'),
});
export type SuggestMealsFromIngredientsOutput = z.infer<typeof SuggestMealsFromIngredientsOutputSchema>;


export async function suggestMealsFromIngredients(input: SuggestMealsFromIngredientsInput): Promise<SuggestMealsFromIngredientsOutput> {
  return suggestMealsFromIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealsFromIngredientsPrompt',
  input: {schema: SuggestMealsFromIngredientsInputSchema},
  output: {schema: SuggestMealsFromIngredientsOutputSchema},
  prompt: `You are a creative chef that helps users come up with meal ideas based on ingredients they have on hand.
User's Available Ingredients: {{{ingredients}}}
Desired Meal Type: {{#if mealType}}{{{mealType}}}{{else}}Any suitable meal{{/if}}
Dietary Preferences/Restrictions: {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}None specified{{/if}}

Your task is to suggest UP TO 5 distinct meal ideas.
Prioritize using the ingredients provided by the user. You can assume common pantry staples like salt, pepper, basic oils unless specified as unavailable.
If essential ingredients are missing for a typical meal, you can state that or suggest a very simple preparation for fewer meals.

Output EXACTLY a JSON object. This JSON object MUST have a single key "mealSuggestions".
The value of "mealSuggestions" MUST be an array of JSON objects.
Each object in the "mealSuggestions" array MUST represent a single meal and have the following fields:
- "name": string (The name of the meal)
- "description": string (A brief description of the meal. CRITICALLY IMPORTANT: Include simple, step-by-step preparation instructions within this description.)
- "calories": string (Optional. Approximate calorie count, e.g., "Approximately 350 calories")
- "ingredientsUsed": array of strings (Optional. Key ingredients from user's input used in this suggestion)

Do not include any introductory text, numbering, or any other text outside of the main JSON object.

Example of the exact output format:
{
  "mealSuggestions": [
    {
      "name": "Quick Tomato and Spinach Scramble",
      "description": "A fast and easy scramble. Heat a pan with a little oil. Add spinach and chopped tomatoes, cook until spinach wilts. Pour in whisked eggs seasoned with salt and pepper. Scramble until cooked to your liking.",
      "calories": "Approximately 280 calories",
      "ingredientsUsed": ["eggs", "spinach", "tomatoes"]
    },
    {
      "name": "Simple Cheese Quesadilla",
      "description": "Place cheese between two tortillas. Cook in a pan until golden brown and cheese is melted. Slice and serve. Add tomatoes if desired.",
      "calories": "Approximately 300 calories",
      "ingredientsUsed": ["cheese", "tortillas", "tomatoes"]
    }
  ]
}
`,
});

const suggestMealsFromIngredientsFlow = ai.defineFlow(
  {
    name: 'suggestMealsFromIngredientsFlow',
    inputSchema: SuggestMealsFromIngredientsInputSchema,
    outputSchema: SuggestMealsFromIngredientsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.mealSuggestions) {
        console.error("Meal from ingredients flow did not receive valid output from the prompt.");
        // Return an empty list if the AI fails to provide valid JSON
        return { mealSuggestions: [] };
    }
    // The output should already be parsed by Genkit based on the outputSchema.
    return output;
  }
);

