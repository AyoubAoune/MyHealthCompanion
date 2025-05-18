'use server';

/**
 * @fileOverview Provides personalized meal suggestions based on caloric limits and dietary preferences.
 *
 * - suggestMeals - A function that generates meal suggestions.
 * - SuggestMealsInput - The input type for the suggestMeals function.
 * - SuggestMealsOutput - The return type for the suggestMeals function.
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
      'The dietary preferences of the user, such as vegetarian, vegan, gluten-free, etc.'
    ),
  avoidFoods: z
    .string()
    .describe('Foods the user wants to avoid, comma separated.'),
});
export type SuggestMealsInput = z.infer<typeof SuggestMealsInputSchema>;

const SuggestMealsOutputSchema = z.object({
  mealSuggestions: z
    .string()
    .describe('A list of meal suggestions that meet the specified criteria.'),
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

Calorie Limit: {{{calorieLimit}}}
Dietary Preferences: {{{dietaryPreferences}}}
Foods to Avoid: {{{avoidFoods}}}

Provide a variety of meal options for breakfast, lunch, and dinner that align with their health goals.

Output the suggestions in a readable format.
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
    return output!;
  }
);
