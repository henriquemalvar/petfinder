interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
  label: string;
}

export function StepProgress({ currentStep, totalSteps = 5, label }: StepProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-semibold text-primary">{label}</span>
        <span className="text-sm text-muted-foreground">
          {currentStep} de {totalSteps}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
