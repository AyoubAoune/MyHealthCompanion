
"use client";

import type { UserSettings } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Beef, Leaf, Flame, Edit, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "./AppContext";

export function DailyGoalsCard() {
  const { userSettings, updateUserSettings } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editableSettings, setEditableSettings] = useState(userSettings);
  const { toast } = useToast();

  useEffect(() => {
    setEditableSettings(userSettings);
  }, [userSettings]);

  const handleInputChange = (field: keyof Pick<UserSettings, 'dailyCalorieTarget' | 'dailyProteinTarget' | 'dailyFiberTarget'>, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditableSettings(prev => ({ ...prev, [field]: numValue }));
    } else if (value === "") {
       setEditableSettings(prev => ({ ...prev, [field]: 0 }));
    }
  };
  
  const handleNameChange = (value: string) => {
    setEditableSettings(prev => ({ ...prev, name: value }));
  };

  const handleSave = () => {
    updateUserSettings(editableSettings);
    setIsEditing(false);
    toast({
      title: "Goals Updated",
      description: "Your daily goals have been saved.",
      variant: "default",
    });
  };

  const handleCancel = () => {
    setEditableSettings(userSettings);
    setIsEditing(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Daily Goals</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
          </Button>
        </div>
        <CardDescription>Your personalized daily nutritional targets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={editableSettings.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input id="calories" type="number" value={editableSettings.dailyCalorieTarget.toString()} onChange={(e) => handleInputChange('dailyCalorieTarget', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input id="protein" type="number" value={editableSettings.dailyProteinTarget.toString()} onChange={(e) => handleInputChange('dailyProteinTarget', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input id="fiber" type="number" value={editableSettings.dailyFiberTarget.toString()} onChange={(e) => handleInputChange('dailyFiberTarget', e.target.value)} />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GoalDisplay icon={Flame} label="Calories" value={userSettings.dailyCalorieTarget} unit="kcal" />
            <GoalDisplay icon={Beef} label="Protein" value={userSettings.dailyProteinTarget} unit="g" />
            <GoalDisplay icon={Leaf} label="Fiber" value={userSettings.dailyFiberTarget} unit="g" />
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Goals</Button>
        </CardFooter>
      )}
    </Card>
  );
}

interface GoalDisplayProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
}

function GoalDisplay({ icon: Icon, label, value, unit }: GoalDisplayProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md">
      <Icon className="h-6 w-6 text-primary" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value} <span className="text-xs">{unit}</span></p>
      </div>
    </div>
  );
}
