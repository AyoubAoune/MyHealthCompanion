
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Loader2, Info, ListChecks, Utensils, RefreshCw, Timer, CheckSquare, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";
import { searchFoodProducts, type SearchFoodProductsOutput } from "@/ai/flows/get-food-nutrition-flow";
import type { LoggedEntry, ProductSearchResultItem, MealType } from "./types";
import { MEAL_TYPES } from "./types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApiTimingInfo {
  fetchMs?: number;
  parseMs?: number;
  processingMs?: number;
}

export function LogIntakeForm() {
  const { logIntake } = useAppContext();
  const { toast } = useToast();

  const [foodNameQuery, setFoodNameQuery] = useState("");
  const [quantity, setQuantity] = useState("100"); // Quantity in grams
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MEAL_TYPES[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResultItem[] | null>(null);
  
  const [itemForPreview, setItemForPreview] = useState<ProductSearchResultItem | null>(null);
  const [itemToLog, setItemToLog] = useState<ProductSearchResultItem | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);
  const [searchCache, setSearchCache] = useState<Record<string, ProductSearchResultItem[]>>({});
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>("");
  const [apiTimingInfo, setApiTimingInfo] = useState<ApiTimingInfo | null>(null);


  const handleSearchFood = useCallback(async (forceRefresh = false) => {
    const query = foodNameQuery.trim().toLowerCase();
    if (!query) {
      toast({ title: "Missing Food Name", description: "Please enter a food item to search.", variant: "destructive" });
      return;
    }

    setApiError(null);
    setItemForPreview(null);
    setItemToLog(null);
    setSearchResults(null); 
    setLastSearchedQuery(foodNameQuery.trim());
    setApiTimingInfo(null); 


    if (!forceRefresh && searchCache[query]) {
      setSearchResults(searchCache[query]);
      if (searchCache[query].length === 0) {
        setApiError(`No products found for "${foodNameQuery.trim()}" in cache. Try a new search.`);
      }
      return;
    }

    setIsSearching(true);
    try {
      const result: SearchFoodProductsOutput = await searchFoodProducts({ foodName: foodNameQuery.trim() });
      
      if (result.apiFetchDurationMs !== undefined || result.jsonParseDurationMs !== undefined || result.processingDurationMs !== undefined) {
        setApiTimingInfo({ 
          fetchMs: result.apiFetchDurationMs, 
          parseMs: result.jsonParseDurationMs,
          processingMs: result.processingDurationMs 
        });
      }

      if (result.error) {
        setApiError(result.error);
        setSearchResults([]); 
        setSearchCache(prevCache => ({ ...prevCache, [query]: [] }));
      } else if (result.products && result.products.length > 0) {
        setSearchResults(result.products);
        setSearchCache(prevCache => ({ ...prevCache, [query]: result.products }));
      } else {
        setApiError(`No products found containing "${foodNameQuery.trim()}".`);
        setSearchResults([]);
        setSearchCache(prevCache => ({ ...prevCache, [query]: [] }));
      }
    } catch (error) {
      console.error("Error calling searchFoodProducts:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while searching for food data.";
      setApiError(`Search failed: ${errorMessage}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [foodNameQuery, searchCache, toast]);

  const handlePreviewItem = (product: ProductSearchResultItem) => {
    setItemForPreview(product);
    setItemToLog(null); // Clear any item that was ready to log
    setApiError(null); 
  };

  const handleSelectItemForLogging = () => {
    if (itemForPreview) {
      setItemToLog(itemForPreview);
      // setItemForPreview(null); // Keep preview visible until user logs or searches again, or hides results list
      setQuantity("100"); // Reset quantity for new item
    }
  };

  const handleLogFoodItem = () => {
    if (!itemToLog) {
      toast({ title: "No Product Selected", description: "Please select a product and confirm it for logging.", variant: "destructive" });
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

    const scaleFactor = numQuantity / 100; 
    const nutritionData = itemToLog.nutritionData;

    const entryToLogOmitId: Omit<LoggedEntry, 'id'> = {
      foodItemName: itemToLog.displayName,
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

    logIntake(entryToLogOmitId);

    toast({
      title: "Food Logged!",
      description: `${entryToLogOmitId.foodItemName} (${numQuantity}g) for ${selectedMealType} has been added.`,
      variant: "default",
      className: "bg-accent text-accent-foreground",
    });

    setQuantity("100");
    setItemToLog(null); 
    setItemForPreview(null); // Also clear preview after logging
  };
  
  const clearSearchAndSelection = () => {
    setFoodNameQuery("");
    setSearchResults(null);
    setItemForPreview(null);
    setItemToLog(null);
    setApiError(null);
    setLastSearchedQuery("");
    setApiTimingInfo(null);
  };

  const displayValue = (value: number | null, scaleFactor: number = 1, unit: string = "g") => {
    if (value === null) return "N/A";
    const scaledValue = value * scaleFactor;
    return `${unit === 'kcal' ? Math.round(scaledValue) : parseFloat(scaledValue.toFixed(1))} ${unit}`;
  };

  const currentScaleFactor = itemToLog ? (parseFloat(quantity) || 100) / 100 : 1;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Log Your Food</CardTitle>
        <CardDescription>Search, preview, select, specify meal type and quantity, then log.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input - always visible unless an item is fully selected for logging */}
        {!itemToLog && (
          <div className="space-y-2">
            <Label htmlFor="food-name-query">Food Item Search</Label>
            <div className="flex space-x-2">
              <Input
                id="food-name-query"
                type="text"
                placeholder="e.g., Apple, Chicken Breast"
                value={foodNameQuery}
                onChange={(e) => setFoodNameQuery(e.target.value)}
                disabled={isSearching}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchFood(); }}}
              />
              <Button onClick={() => handleSearchFood()} disabled={isSearching || !foodNameQuery.trim()} size="icon" aria-label="Search Food">
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>
             { (searchResults || apiError || apiTimingInfo || itemForPreview) && !itemToLog &&
                <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary hover:text-primary/80" onClick={clearSearchAndSelection}>
                    Clear search & selection
                </Button>
             }
          </div>
        )}

        {apiTimingInfo && !itemToLog && (
          <div className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/20 flex items-center space-x-2">
            <Timer className="h-4 w-4 text-primary" />
            <div>
              {apiTimingInfo.fetchMs !== undefined && <span>API Fetch: <b>{apiTimingInfo.fetchMs}ms</b></span>}
              {apiTimingInfo.parseMs !== undefined && <span className="ml-2">JSON Parse: <b>{apiTimingInfo.parseMs}ms</b></span>}
              {apiTimingInfo.processingMs !== undefined && <span className="ml-2">Processing: <b>{apiTimingInfo.processingMs}ms</b></span>}
            </div>
          </div>
        )}

        {apiError && !itemToLog && (
           <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Search Information</AlertTitle>
              <AlertDescription>
                {apiError}
                {lastSearchedQuery && <Button variant="link" size="sm" className="p-0 h-auto text-xs ml-1" onClick={() => handleSearchFood(true)}>Try searching again?</Button>}
              </AlertDescription>
          </Alert>
        )}
        
        {/* Search Results List - visible if results exist and no item is confirmed for logging */}
        {searchResults && searchResults.length > 0 && !itemToLog && (
          <div className="space-y-2">
            <h4 className="font-semibold text-md flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/> Select from "{lastSearchedQuery}" to preview:</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2 bg-muted/30">
              <div className="space-y-1">
                {searchResults.map((item) => (
                  <Button
                    key={item.id}
                    variant={itemForPreview?.id === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-2 text-sm"
                    onClick={() => handlePreviewItem(item)}
                  >
                    {item.displayName}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Preview Pane - visible if an item is selected for preview and not yet confirmed for logging */}
        {itemForPreview && !itemToLog && (
          <Card className="bg-secondary/30">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg flex items-center"><Eye className="mr-2 h-5 w-5 text-primary"/>Previewing: {itemForPreview.displayName}</CardTitle>
              <CardDescription>Nutritional information per 100g.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5 text-sm pb-4">
              <NutrientDisplay label="Calories" value={displayValue(itemForPreview.nutritionData.calories, 1, "kcal")} />
              <NutrientDisplay label="Protein" value={displayValue(itemForPreview.nutritionData.protein, 1, "g")} />
              <NutrientDisplay label="Fat (Total)" value={displayValue(itemForPreview.nutritionData.fat, 1, "g")} />
              <NutrientDisplay label="  Healthy Fats" value={displayValue(itemForPreview.nutritionData.healthyFats, 1, "g")} note="Mono + Poly" />
              <NutrientDisplay label="  Unhealthy Fats" value={displayValue(itemForPreview.nutritionData.unhealthyFats, 1, "g")} note="Sat + Trans" />
              <NutrientDisplay label="Carbohydrates" value={displayValue(itemForPreview.nutritionData.carbs, 1, "g")} />
              <NutrientDisplay label="  Sugars" value={displayValue(itemForPreview.nutritionData.sugar, 1, "g")} />
              <NutrientDisplay label="Fiber" value={displayValue(itemForPreview.nutritionData.fiber, 1, "g")} />
            </CardContent>
            <CardFooter className="pb-4">
              <Button onClick={handleSelectItemForLogging} className="w-full">
                <CheckSquare className="mr-2 h-5 w-5" /> Use This Item for Logging
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Logging Pane - visible if an item is confirmed for logging */}
        {itemToLog && (
          <>
            <div className="p-3 border rounded-md bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
              <h4 className="font-semibold text-md mb-2 text-green-700 dark:text-green-300">
                Logging: <span className="text-primary">{itemToLog.displayName}</span>
              </h4>
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

              <div className="space-y-2 mt-3">
                <Label htmlFor="meal-type-select">Meal Type</Label>
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

              <div className="mt-4 p-3 border rounded-md bg-secondary/30 space-y-0.5 text-sm">
                <h5 className="font-semibold text-md mb-1.5 flex items-center">
                  <Utensils className="mr-2 h-5 w-5 text-primary"/>
                  Nutrition for {quantity}g:
                </h5>
                <NutrientDisplay label="Calories" value={displayValue(itemToLog.nutritionData.calories, currentScaleFactor, "kcal")} />
                <NutrientDisplay label="Protein" value={displayValue(itemToLog.nutritionData.protein, currentScaleFactor, "g")} />
                <NutrientDisplay label="Fat (Total)" value={displayValue(itemToLog.nutritionData.fat, currentScaleFactor, "g")} />
                <NutrientDisplay label="  Healthy Fats" value={displayValue(itemToLog.nutritionData.healthyFats, currentScaleFactor, "g")} note="Mono + Poly" />
                <NutrientDisplay label="  Unhealthy Fats" value={displayValue(itemToLog.nutritionData.unhealthyFats, currentScaleFactor, "g")} note="Sat + Trans" />
                <NutrientDisplay label="Carbohydrates" value={displayValue(itemToLog.nutritionData.carbs, currentScaleFactor, "g")} />
                <NutrientDisplay label="  Sugars" value={displayValue(itemToLog.nutritionData.sugar, currentScaleFactor, "g")} />
                <NutrientDisplay label="Fiber" value={displayValue(itemToLog.nutritionData.fiber, currentScaleFactor, "g")} />
              </div>
               <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary hover:text-primary/80 mt-3" onClick={() => {setItemToLog(null); /* setItemForPreview(null); keeps search results if user wants to pick another */ }}>
                Change selection or search again
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleLogFoodItem}
          disabled={isSearching || !itemToLog || parseFloat(quantity) <= 0 || !selectedMealType}
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
    <div className="flex justify-between items-baseline text-xs py-0.5">
      <span className="text-muted-foreground">{label}{note && <span className="text-xs"> ({note})</span>}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

