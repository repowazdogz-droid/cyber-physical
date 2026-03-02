import { Suspense } from "react";
import TrainingClient from "./trainingClient";

export default function Training() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      <TrainingClient />
    </Suspense>
  );
}
