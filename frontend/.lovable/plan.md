

## Make Orchestration Steps API-Driven

Currently, all steps auto-advance via `setTimeout` delays with hardcoded durations. This plan refactors the orchestration so each step only progresses when an explicit function is called, allowing real API endpoints to drive the flow.

### How It Will Work

Each step will:
1. Start its envelope animation (looping continuously)
2. Wait indefinitely until a "complete" function is called with response data
3. Only then stop the animation and advance to the next step

### Changes

**`src/hooks/useOrchestration.ts`** -- Core refactor:

- Remove all `setTimeout` calls that auto-advance steps (lines 296-299 for normal steps, lines 288-290 for shortlist)
- Export new functions from the hook that external code can call to trigger each step transition:
  - `completeStep1(intentData)` -- Local Agent parsed intent, advance to step 2
  - `completeStep2(manifestData)` -- Card reading done (keeps existing sequential read, but waits for call to trigger shortlist fly + advance to step 3)
  - `completeStep3(shortlistData)` -- Shortlisted agents received, advance to step 4
  - `completeStep4(connectionData)` -- Agent connected, advance to step 5
  - `completeStep5(schemaData)` -- Execution result received, complete the flow
- Each `completeStepN` function will:
  - Stop the looping envelope animation
  - Add the response data as a console entry
  - Advance `currentStep` to the next step (which starts the next envelope loop)
- The `start()` function will still kick off step 1's envelope animation, but will NOT auto-advance
- Simplify to a single generic `completeCurrentStep(responseData)` function that checks `currentStep` and advances accordingly

**`src/pages/Index.tsx`** -- Expose step completion:

- Destructure the new `completeCurrentStep` function from `useOrchestration()`
- For now, add a temporary "Next Step" button (visible during running state) so the flow can be tested manually before real API integration
- This button calls `completeCurrentStep()` with the existing dummy payload for that step

### Technical Details

```text
Current flow:
  start() -> setTimeout -> advanceToStep(1) -> setTimeout -> advanceToStep(2) -> ...

New flow:
  start() -> advanceToStep(1) -> [envelope loops] -> completeCurrentStep(data) -> advanceToStep(2) -> [envelope loops] -> completeCurrentStep(data) -> ...
```

The `advanceToStep` function will be simplified:
- Set the current step, active edge, and start envelope animation
- Remove the `setTimeout` that triggers the next step
- Step 2 (card reading) will still auto-read cards sequentially, but will NOT auto-advance after shortlist fly -- it waits for `completeCurrentStep()`

The hook's return value changes from `{ state, start, replay }` to `{ state, start, replay, completeCurrentStep }`.

### Step 2 Special Handling

Step 2 has the card reading animation. The plan:
- Cards still read sequentially (automatic visual animation)
- After all cards are read, the shortlist phase triggers automatically (cards fly to local agent)
- But the step does NOT advance to step 3 until `completeCurrentStep()` is called
- This means the envelope on step 3's path only starts when the real API confirms the shortlist

