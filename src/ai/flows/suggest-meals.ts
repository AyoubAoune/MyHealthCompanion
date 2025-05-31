
'use server';

/**
 * @fileOverview Provides personalized meal suggestions based on caloric limits and dietary preferences.
 *
 * - suggestMeals - A function that generates meal suggestions.
 * - SuggestMealsInput - The input type for the suggestMeals function.
 * - SuggestMealsOutput - The return type for the suggestMeals function, now an array of meal objects.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealsInputSchema = z.object({
  calorieLimit: z
    .number()
    .describe('The daily calorie limit for meal suggestions.'),
  dietaryPreferences: z
    .string()
    .describe(
      'The dietary preferences of the user, such as vegetarian, vegan, gluten-free, etc. Can be empty.'
    ),
  timeOfDay: z
    .string()
    .describe(
      'The time of day for the meal, e.g., "Breakfast", "Lunch", "Dinner", "Morning snack", "Afternoon snack", "Late snack".'
    ),
  avoidFoods: z
    .string()
    .describe('Foods the user wants to avoid, comma separated. Can be empty.'),
});
export type SuggestMealsInput = z.infer<typeof SuggestMealsInputSchema>;

const MealItemSchema = z.object({
  name: z.string().describe('The name or title of the meal suggestion. Example: "Apple slices with 2 tablespoons of peanut butter"'),
  description: z.string().describe('A brief description of the meal, including key ingredients or benefits. Example: "A classic combination providing fiber, healthy fats, and some protein."'),
  calories: z.string().describe('Approximate calorie count for the meal as a string. Example: "Approximately 190 calories" or "About 200 kcal"'),
  ingredients: z.array(z.string()).optional().describe('A list of key ingredients needed for this meal. Example: ["Apple", "Peanut butter", "Cinnamon"]')
});
export type MealItem = z.infer<typeof MealItemSchema>;

const SuggestMealsOutputSchema = z.object({
  mealSuggestions: z.array(MealItemSchema).describe('A list of individual meal suggestion objects. Should contain between 5 and 10 suggestions if possible.'),
});
export type SuggestMealsOutput = z.infer<typeof SuggestMealsOutputSchema>;

export async function suggestMeals(input: SuggestMealsInput): Promise<SuggestMealsOutput> {
  return suggestMealsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMealsPrompt',
  input: {schema: SuggestMealsInputSchema},
  output: {schema: SuggestMealsOutputSchema},
  prompt: `You are a meal suggestion expert. You will provide a list of meal suggestions based on the user's caloric limit, dietary preferences, and foods to avoid.
Time of Day: {{{timeOfDay}}}
Calorie Limit: {{{calorieLimit}}}
Dietary Preferences: {{{dietaryPreferences}}}
Foods to Avoid: {{{avoidFoods}}}

Provide between 5 and 10 meal suggestions.
Focus the suggestions for that specific meal time ({{{timeOfDay}}}).
Ensure each suggestion is under the specified calorie limit ({{{calorieLimit}}}).
If dietary preferences are provided ({{{dietaryPreferences}}}), adhere to them.
If foods to avoid are listed ({{{avoidFoods}}}), ensure suggestions do not contain them.

Output EXACTLY a JSON object. This JSON object MUST have a single key "mealSuggestions".
The value of "mealSuggestions" MUST be an array of JSON objects.
Each object in the "mealSuggestions" array MUST represent a single meal and have the following fields:
- "name": string (The name or title of the meal suggestion. e.g., "Apple slices with 2 tablespoons of peanut butter")
- "description": string (A brief description of the meal, including key ingredients or benefits. e.g., "A classic combination providing fiber, healthy fats, and some protein.")
- "calories": string (Approximate calorie count for the meal, as a string. e.g., "Approximately 190 calories")
- "ingredients": array of strings (Optional. A list of 3-5 key ingredients for the meal. e.g., ["Apple", "Peanut Butter"])

Do not include any introductory text, numbering, or any other text outside of the main JSON object.

Example of the exact output format:
{
  "mealSuggestions": [
    {
      "name": "Greek yogurt with berries and nuts",
      "description": "A 5.3-ounce container of non-fat Greek yogurt (about 100 calories) topped with 1/2 cup of mixed berries (about 40 calories) and a tablespoon of almonds (about 50 calories). This snack is high in protein, antioxidants, and healthy fats.",
      "calories": "Approximately 190 calories",
      "ingredients": ["Non-fat Greek yogurt", "Mixed berries", "Almonds"]
    },
    {
      "name": "Hard-boiled egg and a piece of fruit",
      "description": "One large hard-boiled egg is a protein-packed snack, paired with a piece of fruit like an orange for vitamin C.",
      "calories": "Approximately 150 calories",
      "ingredients": ["Large egg", "Orange"]
    }
  ]
}
`,
});

const suggestMealsFlow = ai.defineFlow(
  {
    name: 'suggestMealsFlow',
    inputSchema: SuggestMealsInputSchema,
    outputSchema: SuggestMealsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        // Handle cases where the LLM might not return valid JSON matching the schema.
        // This could be due to prompt issues, model limitations, or unexpected responses.
        console.error("Meal suggestion flow did not receive valid output from the prompt.");
        return { mealSuggestions: [] }; // Return empty suggestions or throw an error
    }
    // The output should already be parsed by Genkit based on the outputSchema.
    return output;
  }
);

