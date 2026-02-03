import { useState, useEffect, useCallback, useRef } from "react";

const ONBOARDING_KEY = "onboarding-completed";
const ONBOARDING_STEPS = ["dashboard", "hotspot", "finance", "safety"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

interface UseOnboardingReturn {
  isOnboardingComplete: boolean;
  currentStep: number;
  totalSteps: number;
  stepName: OnboardingStep;
  showOnboarding: boolean;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const completeOnboardingRef = useRef<() => void>();

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsOnboardingComplete(false);
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
  }, []);

  // Store ref to avoid circular dependency in callbacks
  completeOnboardingRef.current = completeOnboarding;

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeOnboardingRef.current?.();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    completeOnboardingRef.current?.();
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsOnboardingComplete(false);
    setCurrentStep(0);
    setShowOnboarding(true);
  }, []);

  return {
    isOnboardingComplete,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    stepName: ONBOARDING_STEPS[currentStep],
    showOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};

