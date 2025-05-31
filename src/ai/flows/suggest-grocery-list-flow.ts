
'use server';
/**
 * @fileOverview Provides AI-powered healthy grocery list suggestions.
 *
 * - suggestGroceryList - Generates a grocery list based on logged foods and custom preferences.
 * - SuggestGroceryListInput - Input type for the suggestGroceryList flow.
 * - SuggestGroceryListOutput - Output type for the suggestGroceryList flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestGroceryListInputSchema = z.object({
  loggedFoodItems: z.array(z.string()).max(50).describe("A list of distinct food items (up to 50) the user has recently logged. Example: ['Apple', 'Chicken Breast', 'Spinach Salad', 'Oats']"),
  customPreferences: z.string().optional().describe("Optional user-provided preferences for this grocery list. Example: 'vegetarian, low-carb, needs ingredients for a fish dish'"),
});
export type SuggestGroceryListInput = z.infer<typeof SuggestGroceryListInputSchema>;

const GroceryListItemSchema = z.object({
  category: z.string().describe("Grocery category, e.g., 'Fresh Produce', 'Proteins', 'Pantry Staples', 'Dairy & Alternatives'"),
  items: z.array(z.string().describe("Specific grocery item, e.g., 'Avocado', 'Salmon Fillets', 'Quinoa', 'Almond Milk'")).min(1),
});
export type GroceryListItem = z.infer<typeof GroceryListItemSchema>;

const SuggestGroceryListOutputSchema = z.object({
  groceryList: z.array(GroceryListItemSchema).describe('A categorized list of suggested grocery items.'),
});
export type SuggestGroceryListOutput = z.infer<typeof SuggestGroceryListOutputSchema>;


export async function suggestGroceryList(input: SuggestGroceryListInput): Promise<SuggestGroceryListOutput> {
  return suggestGroceryListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestGroceryListPrompt',
  input: {schema: SuggestGroceryListInputSchema},
  output: {schema: SuggestGroceryListOutputSchema},
  prompt: `You are a health-focused and insightful shopping assistant.
Your goal is to help the user build a healthy grocery list.

Consider the following information:

1.  User's Recently Logged Food Items (reflects their current eating habits):
    {{#if loggedFoodItems}}
      {{#each loggedFoodItems}}
      - {{{this}}}
      {{/each}}
    {{else}}
      No specific logged items provided by the user. Focus on general healthy eating.
    {{/if}}

2.  User's Custom Preferences for this Grocery List:
    {{#if customPreferences}}
      {{{customPreferences}}}
    {{else}}
      No custom preferences specified for this list.
    {{/if}}

Based on ALL the provided information, suggest a healthy grocery list.
Prioritize whole foods, fresh ingredients, and items that can be combined to create nutritious meals.
If the logged items indicate a pattern of consuming less healthy or processed foods, gently steer suggestions towards healthier alternatives or complementary healthy items that fit their likely taste profile.
Do not be preachy or judgmental. Be encouraging and practical.

Organize the suggestions into 3 to 5 logical grocery store categories (e.g., "Fresh Produce", "Lean Proteins & Plant-Based Alternatives", "Whole Grains & Legumes", "Healthy Fats & Pantry Staples", "Dairy & Alternatives").
For each category, list 3 to 7 diverse and specific grocery items.

Output EXACTLY a JSON object. This JSON object MUST have a single key "groceryList".
The value of "groceryList" MUST be an array of JSON objects.
Each object in the "groceryList" array MUST represent a single grocery category and have the following fields:
- "category": string (The name of the grocery category)
- "items": array of strings (A list of specific grocery items for that category)

Example of the exact output format:
{
  "groceryList": [
    {
      "category": "Fresh Produce",
      "items": ["Spinach", "Blueberries", "Avocado", "Broccoli", "Sweet Potatoes", "Apples"]
    },
    {
      "category": "Lean Proteins & Plant-Based Alternatives",
      "items": ["Chicken Breast (skinless)", "Salmon Fillets", "Eggs", "Lentils", "Tofu (firm)"]
    },
    {
      "category": "Whole Grains & Legumes",
      "items": ["Quinoa", "Oats (rolled)", "Brown Rice", "Chickpeas (canned or dry)"]
    }
  ]
}

Do not include any introductory text, numbering, or any other text outside of the main JSON object.
`,
});

const suggestGroceryListFlow = ai.defineFlow(
  {
    name: 'suggestGroceryListFlow',
    inputSchema: SuggestGroceryListInputSchema,
    outputSchema: SuggestGroceryListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.groceryList) {
        console.error("Grocery list suggestion flow did not receive valid output from the prompt.");
        return { groceryList: [] };
    }
    return output;
  }
);
