# Multi-Step Form Component

Refactored multi-step form component with modular design for improved maintainability and readability.

## 📁 File Structure

```
multi-step-form/
├── index.tsx                    # Main container - manages state and step flow
├── types.ts                     # Shared types, schemas, and constants
├── README.md                    # Documentation
│
├── steps/                       # Step components
│   ├── first-step.tsx          # Step 1: Photo upload
│   ├── second-step.tsx         # Step 2: Add metadata
│   ├── third-step.tsx          # Step 3: Location info (to be implemented)
│   └── fourth-step.tsx         # Step 4: Preview (to be implemented)
│
└── components/                  # UI components
    ├── progress-bar.tsx        # Progress bar
    ├── step-indicator.tsx      # Step indicator
    └── success-screen.tsx      # Success screen
```

## 🎯 Design Principles

### 1. Separation of Concerns

- **index.tsx**: Only responsible for state management and step flow control
- **steps/**: Each step's form logic and UI are independent
- **components/**: Reusable UI components
- **types.ts**: Centralized type definitions and validation rules

### 2. Single Responsibility

Each file handles one specific function:

- Step components: Handle form validation and UI for that step
- UI components: Pure presentation logic
- Main component: Coordinate overall flow

### 3. Extensibility

- Add new step: Create new component in `steps/`
- Modify step: Only edit corresponding step file
- Shared logic: Add to `types.ts`

## 🔧 Usage

### Import Component

```typescript
import MultiStepForm from "@/modules/photos/ui/components/multi-step-form";
```

### Basic Usage

```typescript
<MultiStepForm
  onSubmit={(data) => {
    console.log("Form submitted:", data);
  }}
/>
```

## 📝 Adding New Steps

1. **Create Step Component** (`steps/new-step.tsx`)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepProps } from "../types";

export function NewStep({ onNext, onBack, initialData }: StepProps) {
  // Implement step logic
}
```

2. **Add Schema** (`types.ts`)

```typescript
export const newStepSchema = z.object({
  // Define field validation
});
```

3. **Update Configuration** (`types.ts`)

```typescript
export const STEP_CONFIG = [
  // ... existing steps
  {
    id: "new-step",
    title: "New Step",
    description: "Step description",
  },
];
```

4. **Integrate in Main Component** (`index.tsx`)

```typescript
import { NewStep } from "./steps/new-step";

// Add case in renderStep()
case 4:
  return <NewStep {...commonProps} onNext={handleNext} />;
```

## 🎨 Component Responsibilities

### index.tsx

- ✅ Manage global state (step, formData, isSubmitting, etc.)
- ✅ Handle step navigation
- ✅ Coordinate data flow between steps
- ✅ Final form submission

### Step Components (first-step.tsx, second-step.tsx, etc.)

- ✅ Form fields and validation for that step
- ✅ Step-specific UI layout
- ✅ Step-specific interaction logic
- ✅ Call `onNext()` to pass data

### UI Components (progress-bar.tsx, step-indicator.tsx, etc.)

- ✅ Pure presentation logic
- ✅ Reusable
- ✅ Receive props, don't manage state

## 🔄 Data Flow

```
User Input
   ↓
Step Component Form Validation
   ↓
onNext(stepData)
   ↓
index.tsx Merges Data
   ↓
Update formData State
   ↓
Pass to Next Step
```

## 🚀 Advantages

1. **Maintainability**: Clear responsibilities for each file, easy to modify
2. **Testability**: Independent components, easy to unit test
3. **Reusability**: UI components can be used elsewhere
4. **Extensibility**: Adding new steps doesn't affect existing code
5. **Code Clarity**: Avoids single file becoming too long

## 📊 Comparison with Original Component

| Feature         | Original   | Refactored           |
| --------------- | ---------- | -------------------- |
| Lines of Code   | ~750 lines | Main file ~230 lines |
| Maintainability | ⭐⭐       | ⭐⭐⭐⭐⭐           |
| Testability     | ⭐⭐       | ⭐⭐⭐⭐⭐           |
| Extensibility   | ⭐⭐       | ⭐⭐⭐⭐⭐           |
| Code Reuse      | ⭐⭐       | ⭐⭐⭐⭐             |

## 🛠 Development Recommendations

1. **Step Components**: Keep step components simple, focus only on that step's logic
2. **Shared Logic**: Extract common logic used by multiple steps into utility functions
3. **Type Safety**: Fully leverage TypeScript type definitions
4. **Form Validation**: Define in schemas, apply in step components
5. **UI Consistency**: Use shared UI components to maintain interface uniformity
