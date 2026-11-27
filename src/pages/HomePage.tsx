import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { GlobeHero } from "../features/onboarding/GlobeHero";
import { QuickSetup } from "../features/onboarding/QuickSetup";
import { fade, onServer } from "../shared/motion";

/**
 * The first visit, in two screens: the globe with every city (pick one right on it), then one short
 * form and straight into the guide. Language comes from the browser and can be switched in the header.
 */
export function HomePage({ startStep, onFinish }: { startStep: number; onFinish: (target: "places" | "planner") => void }) {
  const [step, setStep] = useState(Math.min(startStep, 1));
  const go = (next: number) => { setStep(next); window.scrollTo({ top: 0 }); };
  return <AnimatePresence mode="wait" initial={false}>
    <m.div key={step} {...fade} initial={onServer ? false : fade.initial}>
      {step === 0 ? <GlobeHero onStart={() => go(1)} onOpen={() => onFinish("places")} />
        : <QuickSetup onBack={() => go(0)} onFinish={onFinish} />}
    </m.div>
  </AnimatePresence>;
}
