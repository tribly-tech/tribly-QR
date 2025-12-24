# Components Directory

This directory contains all reusable components for the project.

## Structure

- `ui/` - shadcn/ui components (Button, Card, etc.)
- `[feature]/` - Feature-specific components that reuse UI components

## Component Reuse Guidelines

### ✅ DO:
- **Always reuse shadcn/ui components** from `@/components/ui` instead of creating new ones
- Import components from `@/components/ui` or use the index file `@/components/ui`
- Extend shadcn components by wrapping them, not by duplicating them
- Create feature-specific components that compose shadcn components

### ❌ DON'T:
- Create new button/card/input components - use shadcn components
- Duplicate component logic - always check if a shadcn component exists first
- Import from other component libraries - only use shadcn/ui

## Adding New shadcn Components

To add new shadcn components, use the CLI:

```bash
npx shadcn@latest add [component-name]
```

This will automatically add the component to `src/components/ui/` and update the necessary files.

## Example: Creating a Reusable Feature Component

```tsx
// src/components/feature/MyFeatureCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";

export function MyFeatureCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}
```

## Available shadcn Components

All components are available from `@/components/ui`:

- `Button` - Button component with variants
- `Card` - Card component with header, content, footer
- More components can be added using `npx shadcn@latest add [component]`

