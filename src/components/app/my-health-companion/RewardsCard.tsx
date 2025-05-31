
"use client";

import { useState } from 'react';
import { useAppContext } from "./AppContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trophy, Sparkles, Gift } from "lucide-react";
import { PRIZES, type Prize } from "./types"; 
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';

export function RewardsCard() {
  const { userSettings, claimReward } = useAppContext();
  const { toast } = useToast();
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const handleClaimAttempt = (prize: Prize) => {
    if (userSettings.totalRewardPoints >= prize.cost) {
      setSelectedPrize(prize);
    } else {
      toast({
        title: "Not Enough Points",
        description: `You need ${prize.cost} points to claim "${prize.name}". You have ${userSettings.totalRewardPoints}.`,
        variant: "destructive",
      });
    }
  };

  const handleConfirmClaim = () => {
    if (selectedPrize) {
      const success = claimReward(selectedPrize.cost);
      if (success) {
        toast({
          title: "Reward Claimed!",
          description: `You've successfully claimed "${selectedPrize.name}". Enjoy!`,
          className: "bg-accent text-accent-foreground",
        });
      } else {
        toast({
          title: "Claim Failed",
          description: "Could not claim the reward. This might be due to insufficient points or an unexpected error.",
          variant: "destructive",
        });
      }
      setSelectedPrize(null); 
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <Trophy className="mr-2 h-6 w-6 text-primary" />
            Your Rewards
          </CardTitle>
          <div className="flex items-center text-lg font-semibold text-primary">
            <Sparkles className="h-5 w-5 mr-1 text-accent" /> 
            {userSettings.totalRewardPoints} Points
          </div>
        </div>
        <CardDescription>Complete daily habits to earn points and claim awesome prizes!</CardDescription>
      </CardHeader>
      <CardContent>
        {PRIZES && PRIZES.length > 0 ? (
          <ScrollArea className="max-h-80 pr-3">
            <div className="space-y-4">
              {PRIZES.map((prize) => {
                const PrizeIcon = prize.icon || Gift; 
                const canClaim = userSettings.totalRewardPoints >= prize.cost;
                return (
                  <Card key={prize.id} className="bg-card/60 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center">
                          <PrizeIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                          {prize.name}
                        </CardTitle>
                        <Badge variant={canClaim ? "default" : "secondary"} className="text-sm">
                          {prize.cost} Points
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground">{prize.description}</p>
                    </CardContent>
                    <CardFooter>
                      <AlertDialog 
                        open={selectedPrize?.id === prize.id} 
                        onOpenChange={(isOpen) => {
                          if (!isOpen && selectedPrize?.id === prize.id) {
                             setSelectedPrize(null);
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            onClick={() => handleClaimAttempt(prize)}
                            disabled={!canClaim}
                            size="sm"
                            className="w-full"
                          >
                            Claim Reward
                          </Button>
                        </AlertDialogTrigger>
                        {selectedPrize?.id === prize.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Claim</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to spend {selectedPrize?.cost} points to claim "{selectedPrize?.name}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setSelectedPrize(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleConfirmClaim}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">No prizes available at the moment. Check back later!</p>
        )}
      </CardContent>
    </Card>
  );
}
