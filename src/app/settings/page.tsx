
"use client";

import { DailyGoalsCard } from "@/components/app/my-health-companion/DailyGoalsCard";
import { useAppContext } from "@/components/app/my-health-companion/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
// import { ReminderSetupCard } from "@/components/app/my-health-companion/ReminderSetupCard"; 

export default function SettingsPage() {
  const { userSettings, updateUserSettings, isLoading, resetAllData } = useAppContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 space-y-6">
        <header className="mb-8">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </header>
        <div className="max-w-md mx-auto space-y-8">
          <Skeleton className="h-96 w-full rounded-lg" /> {/* DailyGoalsCard Skeleton */}
          <Skeleton className="h-48 w-full rounded-lg" /> {/* Danger Zone Card Skeleton */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-8 flex items-center space-x-3">
        <Avatar className="h-10 w-10 hidden md:flex">
           <AvatarImage src={`https://placehold.co/100x100.png?text=${userSettings.name.substring(0,1)}`} alt={userSettings.name} data-ai-hint="avatar person" />
           <AvatarFallback>{userSettings.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Settings</h1>
          <p className="text-md md:text-lg text-muted-foreground">Manage your preferences and goals.</p>
        </div>
      </header>
      
      <div className="max-w-md mx-auto space-y-8">
        <DailyGoalsCard />
        
        <Card className="shadow-lg border-destructive/50">
          <CardHeader>
            <CardTitle className="text-xl text-destructive flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Manage your application data. These actions are irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Reset All Application Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    your settings, logged food, weight history, body measurements,
                    and checklist progress from this browser.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (resetAllData) {
                        resetAllData();
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, reset data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* 
        // Placeholder for ReminderSetupCard if you want to add it later
        // Make sure to uncomment the import above and the skeleton if used.
        // <ReminderSetupCard userSettings={userSettings} onUpdateSettings={updateUserSettings} /> 
        */}
      </div>
    </div>
  );
}
