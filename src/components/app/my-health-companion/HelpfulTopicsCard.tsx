
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Cookie, MoonStar, Zap, Lightbulb } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TopicDialogProps {
  triggerIcon: React.ElementType;
  triggerTitle: string;
  triggerDescription: string;
  dialogTitle: string;
  shortInfo: React.ReactNode;
  extendedInfoTitle: string;
  extendedInfoWhy: React.ReactNode;
  extendedInfoHow: React.ReactNode;
  extendedInfoAlternatives: React.ReactNode;
  iconColorClass?: string;
}

function TopicDialog({
  triggerIcon: Icon,
  triggerTitle,
  triggerDescription,
  dialogTitle,
  shortInfo,
  extendedInfoTitle,
  extendedInfoWhy,
  extendedInfoHow,
  extendedInfoAlternatives,
  iconColorClass = "text-primary"
}: TopicDialogProps) {
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && setShowMoreInfo(false)}>
      <DialogTrigger asChild>
        <Card className="w-full cursor-pointer hover:shadow-xl transition-shadow duration-200 bg-card/80 hover:bg-card">
          <CardHeader className="flex flex-row items-center gap-4 pb-3">
            <Icon className={`h-10 w-10 ${iconColorClass}`} />
            <div>
              <CardTitle className="text-lg">{triggerTitle}</CardTitle>
              <CardDescription className="text-xs">{triggerDescription}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <Icon className={`h-6 w-6 mr-2 ${iconColorClass}`} />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground pt-2">{shortInfo}</div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4 py-4 text-sm">
            {showMoreInfo && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <h4 className="font-semibold text-md text-primary">{extendedInfoTitle}</h4>
                <div>
                  <h5 className="font-semibold mb-1">Why It Happens:</h5>
                  <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground text-xs">
                    {extendedInfoWhy}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-1">How to Manage/Avoid:</h5>
                  <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground text-xs">
                    {extendedInfoHow}
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-1">Smarter Alternatives:</h5>
                  <ul className="list-disc list-outside pl-5 space-y-1 text-muted-foreground text-xs">
                    {extendedInfoAlternatives}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between gap-2 pt-2">
          <Button variant="outline" onClick={() => setShowMoreInfo(!showMoreInfo)}>
            {showMoreInfo ? "Show Less" : "Learn More"}
          </Button>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HelpfulTopicsCard() {
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-accent" />
            Quick Wellness Tips
        </CardTitle>
        <CardDescription>Tap on a topic to learn more and get helpful insights.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TopicDialog
          triggerIcon={Cookie}
          triggerTitle="Sugar Cravings SOS"
          triggerDescription="Tips to manage those sweet urges."
          dialogTitle="Understanding & Managing Sugar Cravings"
          iconColorClass='text-destructive'
          shortInfo={
            <p>Sugar cravings often arise from stress, habit, or blood sugar fluctuations. Simple strategies can help you regain control and make healthier choices.</p>
          }
          extendedInfoTitle="Deeper Dive into Sugar Cravings:"
          extendedInfoWhy={
            <>
              <li><strong>Blood Sugar Rollercoaster:</strong> High-sugar foods cause spikes, then crashes, leading to more cravings.</li>
              <li><strong>Stress & Emotions:</strong> Comfort eating can be a powerful trigger.</li>
              <li><strong>Habit Loop:</strong> Regularly eating sugar at certain times can create a strong habit.</li>
              <li><strong>Nutrient Gaps:</strong> Deficiencies (e.g., magnesium, chromium) can sometimes manifest as sugar cravings.</li>
            </>
          }
          extendedInfoHow={
            <>
              <li><strong>Hydrate First:</strong> Drink a glass of water; thirst can mimic hunger.</li>
              <li><strong>Protein & Fiber Power:</strong> Eat snacks rich in protein and fiber to stabilize blood sugar.</li>
              <li><strong>Mindful Moments:</strong> Pause and identify if it's true hunger or an emotional trigger.</li>
              <li><strong>Move Your Body:</strong> A short walk can shift your focus.</li>
              <li><strong>Portion Control:</strong> If you indulge, keep it small.</li>
            </>
          }
          extendedInfoAlternatives={
            <>
              <li>Fresh fruits (berries, apple slices with nut butter).</li>
              <li>Greek yogurt with a sprinkle of cinnamon.</li>
              <li>A small square of dark chocolate (70%+ cacao).</li>
              <li>A handful of unsalted nuts or seeds.</li>
              <li>Herbal tea with a hint of natural sweetness (like licorice root).</li>
            </>
          }
        />
        <TopicDialog
          triggerIcon={MoonStar}
          triggerTitle="Late Night Snack Guide"
          triggerDescription="Strategies for healthier evening habits."
          dialogTitle="Navigating Late Night Snack Urges"
          iconColorClass='text-primary'
          shortInfo={
            <p>Late-night snacking can be driven by routine, insufficient daytime eating, or emotional cues. Discover mindful approaches for healthier evenings.</p>
          }
          extendedInfoTitle="Exploring Late Night Snacking:"
          extendedInfoWhy={
            <>
              <li><strong>Daytime Deficit:</strong> Not eating enough during the day can lead to intense nighttime hunger.</li>
              <li><strong>Habit & Routine:</strong> Snacking while watching TV can become an automatic behavior.</li>
              <li><strong>Boredom or Stress:</strong> Food can be a way to cope with emotions or fill time.</li>
              <li><strong>Sleep Deprivation:</strong> Lack of sleep can disrupt hunger hormones (ghrelin and leptin).</li>
              <li><strong>Dehydration:</strong> Thirst is sometimes mistaken for hunger.</li>
            </>
          }
          extendedInfoHow={
            <>
              <li><strong>Balanced Daily Meals:</strong> Ensure adequate, nutritious food intake throughout the day.</li>
              <li><strong>Create a Wind-Down Routine:</strong> Signal to your body it's time for sleep, not food (e.g., reading, bath).</li>
              <li><strong>Hydrate Smartly:</strong> Sip on water or caffeine-free herbal tea.</li>
              <li><strong>Brush Your Teeth Early:</strong> This can act as a deterrent.</li>
              <li><strong>Identify Triggers:</strong> Are you truly hungry, or is it boredom, stress, or habit?</li>
            </>
          }
          extendedInfoAlternatives={
            <>
              <li>A small glass of warm milk or unsweetened almond milk.</li>
              <li>Herbal tea (chamomile, peppermint).</li>
              <li>A few almonds or walnuts (protein and healthy fats).</li>
              <li>A small piece of fruit like a banana or a few cherries (may aid sleep).</li>
              <li>Plain air-popped popcorn (small portion, high in fiber).</li>
              <li>A rice cake with a thin spread of nut butter.</li>
            </>
          }
        />
      </CardContent>
    </Card>
  );
}

