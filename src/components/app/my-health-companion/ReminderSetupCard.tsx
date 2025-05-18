
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { UserSettings } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BellRing, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReminderSetupCardProps {
  userSettings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export function ReminderSetupCard({ userSettings, onUpdateSettings }: ReminderSetupCardProps) {
  // Local state for editing, initialized from props
  const [reminderTime, setReminderTime] = useState(userSettings.reminderTime);
  const [remindersEnabled, setRemindersEnabled] = useState(userSettings.remindersEnabled);
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();
  const reminderTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to update local state if the userSettings prop object reference changes.
  // This handles initial load, and updates after a save operation or from external changes (e.g., localStorage).
  useEffect(() => {
    setReminderTime(userSettings.reminderTime);
    setRemindersEnabled(userSettings.remindersEnabled);
  }, [userSettings]); // Depend on the userSettings object reference itself
  
  // Effect to get initial notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({ title: "Notifications not supported", description: "This browser does not support desktop notifications.", variant: "destructive" });
      return "denied";
    }
    // Only request if permission is 'default'
    if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission); 
        if (permission !== "granted") {
          toast({ title: "Notification Permission Denied", description: "You won't receive reminders.", variant: "destructive" });
        }
        return permission;
    }
    return Notification.permission;
  }, [toast]);
  
  const scheduleReminder = useCallback(() => {
    if (reminderTimeoutIdRef.current) {
      clearTimeout(reminderTimeoutIdRef.current);
      reminderTimeoutIdRef.current = null;
    }

    if (remindersEnabled && notificationPermission === "granted" && reminderTime) {
      const [hours, minutes] = reminderTime.split(":").map(Number);
      const now = new Date();
      let reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

      if (reminderDate <= now) { 
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      const timeUntilReminder = reminderDate.getTime() - now.getTime();
      
      if (timeUntilReminder > 0) {
        reminderTimeoutIdRef.current = setTimeout(() => {
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("MyHealthCompanion Reminder", {
              body: "Time to check in! Log your meals or review your progress.",
              icon: "/logo.png", 
              silent: true, 
            });
          }
          scheduleReminder(); 
        }, timeUntilReminder);
      }
    }
  }, [remindersEnabled, notificationPermission, reminderTime]); 

  useEffect(() => {
    scheduleReminder();
    return () => {
      if (reminderTimeoutIdRef.current) {
        clearTimeout(reminderTimeoutIdRef.current);
      }
    };
  }, [scheduleReminder]);


  const handleSaveReminders = async () => {
    let currentPermission = notificationPermission;
    if (remindersEnabled && currentPermission === "default") { // Check 'default' before requesting
       currentPermission = await requestNotificationPermission();
    }
    
    if (remindersEnabled && currentPermission !== "granted") {
        toast({
            title: "Permission Required",
            description: "Cannot save enabled reminders without notification permission.",
            variant: "destructive",
        });
        return;
    }
    
    onUpdateSettings({ reminderTime, remindersEnabled }); 
    toast({
      title: "Reminders Updated",
      description: "Your reminder settings have been saved.",
    });
  };

  const handleTestNotification = async () => {
    let currentPerm = notificationPermission;
    if (currentPerm === "default") { // Check 'default' before requesting
      currentPerm = await requestNotificationPermission();
    }

    if (currentPerm === "granted" && typeof window !== "undefined" && "Notification" in window){
      new Notification("Test Reminder", {
        body: "This is a test notification from MyHealthCompanion!",
        icon: "/logo.png", 
        silent: true,
      });
       toast({ title: "Test Notification Sent", description: "Check your notifications."});
    } else if (currentPerm !== "granted") {
         toast({ title: "Notification Permission Required", description: "Please grant notification permission to test.", variant: "destructive" });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Reminders</CardTitle>
          <BellRing className="h-6 w-6 text-primary" />
        </div>
        <CardDescription>Set up daily reminders for food logging and progress review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="reminders-enabled" className="flex-grow">Enable Reminders</Label>
          <Switch
            id="reminders-enabled"
            checked={remindersEnabled}
            onCheckedChange={setRemindersEnabled} 
          />
        </div>
        {remindersEnabled && (
          <div>
            <Label htmlFor="reminder-time">Reminder Time</Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)} 
              disabled={!remindersEnabled}
            />
          </div>
        )}
        {remindersEnabled && notificationPermission !== "granted" && (
          <p className="text-sm text-destructive">
            {notificationPermission === "default" 
              ? "Notification permission has not been requested. " 
              : `Notification permission is ${notificationPermission}. `}
            {notificationPermission !== "granted" && "Please grant permission to receive reminders. You might need to click 'Save Reminders' or 'Test Notification' to trigger the prompt if it hasn't appeared."}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <Button variant="outline" onClick={handleTestNotification}>
          Test Notification
        </Button>
        <Button onClick={handleSaveReminders}>
          <Save className="mr-2 h-4 w-4" /> Save Reminders
        </Button>
      </CardFooter>
    </Card>
  );
}
