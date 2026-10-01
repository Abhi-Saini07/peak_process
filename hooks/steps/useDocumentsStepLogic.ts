"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useRequiredDocumentsRemaining } from "@/lib/store/selectors";

export function useDocumentsStepLogic() {
  const router = useRouter();
  const documents = useOnboardingStore((s) => s.documents);
  const uploadProgress = useOnboardingStore((s) => s.uploadProgress);
  const uploadDocument = useOnboardingStore((s) => s.uploadDocument);
  const removeDocument = useOnboardingStore((s) => s.removeDocument);
  const remaining = useRequiredDocumentsRemaining();

  const onContinue = () => router.push("/onboarding/review");

  return { documents, uploadProgress, uploadDocument, removeDocument, remaining, onContinue };
}
