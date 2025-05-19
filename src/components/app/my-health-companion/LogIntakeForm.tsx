
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Loader2, Info, ListChecks, Utensils, Soup } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";
import { searchFoodProducts } from "@/ai/flows/get-food-nutrition-flow";
import type { LoggedEntry, BaseNutritionData, ProductSearchResultItem, MealType } from "./types";
import { MEAL_TYPES } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LogIntakeForm() {
  const { logIntake } = useAppContext();
  const { toast } = useToast();

  const [foodNameQuery, setFoodNameQuery] = useState("");
  const [quantity, setQuantity] = useState("100"); // Quantity in grams
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MEAL_TYPES[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResultItem[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResultItem | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSearchFood = async () => {
    if (!foodNameQuery.trim()) {
      toast({ title: "Missing Food Name", description: "Please enter a food item to search.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setSearchResults(null);
    setSelectedProduct(null);
    setApiError(null);
    try {
      const result = await searchFoodProducts({ foodName: foodNameQuery });
      if (result.error) {
        setApiError(result.error);
        toast({ title: "Search Failed", description: result.error, variant: "destructive" });
      } else if (result.products && result.products.length > 0) {
        setSearchResults(result.products);
      } else {
        setApiError("No products found for your search term."); // More generic "No products found"
        toast({ title: "No Results", description: "No products found for your search term.", variant: "default" });
      }
    } catch (error) {
      console.error("Error calling searchFoodProducts:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while searching for food data.";
      setApiError(errorMessage);
      toast({ title: "API Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: ProductSearchResultItem) => {
    setSelectedProduct(product);
    setSearchResults(null); // Hide search results after selection
  };

  const handleLogFoodItem = () => {
    if (!selectedProduct) {
      toast({ title: "No Product Selected", description: "Please select a product from the search results to log.", variant: "destructive" });
      return;
    }
    if (!selectedMealType) {
      toast({ title: "Meal Type Required", description: "Please select a meal type.", variant: "destructive" });
      return;
    }

    const numQuantity = parseFloat(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ title: "Invalid Quantity", description: "Please enter a valid positive quantity.", variant: "destructive" });
      return;
    }

    const scaleFactor = numQuantity / 100; // API data is per 100g
    const nutritionData = selectedProduct.nutritionData;

    const entryToLog: Omit<LoggedEntry, 'id'> = {
      foodItemName: selectedProduct.displayName,
      mealType: selectedMealType,
      quantity: numQuantity,
      calories: (nutritionData.calories ?? 0) * scaleFactor,
      protein: (nutritionData.protein ?? 0) * scaleFactor,
      fiber: (nutritionData.fiber ?? 0) * scaleFactor,
      fat: (nutritionData.fat ?? 0) * scaleFactor,
      healthyFats: (nutritionData.healthyFats ?? 0) * scaleFactor,
      unhealthyFats: (nutritionData.unhealthyFats ?? 0) * scaleFactor,
      carbs: (nutritionData.carbs ?? 0) * scaleFactor,
      sugar: (nutritionData.sugar ?? 0) * scaleFactor,
    };

    logIntake(entryToLog);

    toast({
      title: "Food Logged!",
      description: `${entryToLog.foodItemName} (${numQuantity}g) for ${selectedMealType} has been added.`,
      variant: "default",
      className: "bg-accent text-accent-foreground",
    });

    // Reset form fields
    setFoodNameQuery("");
    setQuantity("100");
    setSelectedMealType(MEAL_TYPES[0]);
    setSearchResults(null);
    setSelectedProduct(null);
    setApiError(null);
  };

  const displayValue = (value: number | null, scaleFactor: number, unit: string = "g") => {
    if (value === null) return "N/A";
    const scaledValue = value * scaleFactor;
    return `${unit === 'kcal' ? Math.round(scaledValue) : parseFloat(scaledValue.toFixed(1))} ${unit}`;
  };

  const currentScaleFactor = (parseFloat(quantity) || 100) / 100;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Log Your Food</CardTitle>
        <CardDescription>Search, select, specify meal type and quantity, then log nutritional information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedProduct && (
          <>
            <div className="space-y-2">
              <Label htmlFor="food-name-query">Food Item Search</Label>
              <Input
                id="food-name-query"
                type="text"
                placeholder="e.g., Apple, Chicken Breast"
                value={foodNameQuery}
                onChange={(e) => setFoodNameQuery(e.target.value)}
                disabled={isSearching}
              />
            </div>
             <Button onClick={handleSearchFood} disabled={isSearching || !foodNameQuery.trim()} className="w-full">
              {isSearching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
              Search Food
            </Button>
          </>
        )}

        {apiError && !searchResults && !selectedProduct && (
            <Alert variant="destructive" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
            </Alert>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold text-md flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/> Select a food item:</h4>
            <ScrollArea className="h-60 w-full rounded-md border p-2 bg-muted/30">
              <div className="space-y-1">
                {searchResults.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSelectProduct(item)}
                  >
                    {item.displayName}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {selectedProduct && (
          <>
            <div className="space-y-2">
              <Label htmlFor="meal-type-select">Meal Type for <span className="font-semibold text-primary">{selectedProduct.displayName}</span></Label>
              <Select value={selectedMealType} onValueChange={(value: MealType) => setSelectedMealType(value)}>
                <SelectTrigger id="meal-type-select">
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (g)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
            <div className="mt-6 p-4 border rounded-md bg-secondary/30 space-y-2">
              <h4 className="font-semibold text-lg mb-2 flex items-center">
                <Utensils className="mr-2 h-5 w-5 text-primary"/>
                Nutrition for {selectedProduct.displayName} ({quantity}g):
              </h4>
              <NutrientDisplay label="Calories" value={displayValue(selectedProduct.nutritionData.calories, currentScaleFactor, "kcal")} />
              <NutrientDisplay label="Protein" value={displayValue(selectedProduct.nutritionData.protein, currentScaleFactor, "g")} />
              <NutrientDisplay label="Fat (Total)" value={displayValue(selectedProduct.nutritionData.fat, currentScaleFactor, "g")} />
              <NutrientDisplay label="  Healthy Fats" value={displayValue(selectedProduct.nutritionData.healthyFats, currentScaleFactor, "g")} note="Mono + Polyunsaturated" />
              <NutrientDisplay label="  Unhealthy Fats" value={displayValue(selectedProduct.nutritionData.unhealthyFats, currentScaleFactor, "g")} note="Saturated + Trans" />
              <NutrientDisplay label="Carbohydrates" value={displayValue(selectedProduct.nutritionData.carbs, currentScaleFactor, "g")} />
              <NutrientDisplay label="  Sugars" value={displayValue(selectedProduct.nutritionData.sugar, currentScaleFactor, "g")} />
              <NutrientDisplay label="Fiber" value={displayValue(selectedProduct.nutritionData.fiber, currentScaleFactor, "g")} />
               <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => {setSelectedProduct(null); setApiError(null); }}>
                Search for another item or change selection
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleLogFoodItem}
          disabled={isSearching || !selectedProduct || parseFloat(quantity) <= 0 || !selectedMealType}
          className="w-full"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add to Today's Log
        </Button>
      </CardFooter>
    </Card>
  );
}

interface NutrientDisplayProps {
  label: string;
  value: string;
  note?: string;
}

function NutrientDisplay({ label, value, note }: NutrientDisplayProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}{note && <span className="text-xs block"> ({note})</span>}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
