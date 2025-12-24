# Brand Guidelines

This document outlines the brand guidelines for Tribly QR.

## Primary Color

**Primary Color**: `#9747FF`

This purple color is used as the primary brand color throughout the application. It's applied to:
- Primary buttons
- Links and interactive elements
- Focus rings
- Accent elements

### Usage in Code

The primary color is available through Tailwind CSS classes:
- `bg-primary` - Primary background
- `text-primary` - Primary text color
- `border-primary` - Primary border
- `ring-primary` - Primary focus ring

### CSS Variables

The primary color is defined in CSS variables:
- Light mode: `hsl(266, 100%, 64%)`
- Dark mode: `hsl(266, 100%, 70%)` (slightly lighter for better contrast)

## Typography

**Font Family**: Manrope

Manrope is the primary font family used throughout the application. It's loaded via Next.js font optimization for optimal performance.

### Font Loading

The font is automatically loaded in `src/app/layout.tsx` using Next.js's `next/font/google` for optimal performance and automatic font optimization.

### Usage

The font is applied globally to the body element and is available as:
- Default font family (no class needed)
- CSS variable: `var(--font-manrope)`
- Tailwind class: `font-sans` (uses Manrope)

## Implementation Details

### Files Modified

1. **`src/app/layout.tsx`**
   - Added Manrope font import and configuration
   - Applied font to HTML and body elements

2. **`tailwind.config.ts`**
   - Added Manrope to font family configuration
   - Available as `font-sans` class

3. **`src/app/globals.css`**
   - Updated primary color CSS variables
   - Set Manrope as default font family

## Color Palette

The brand color integrates with shadcn/ui's color system:

- **Primary**: `#9747FF` (266° 100% 64%)
- **Primary Foreground**: White (for text on primary background)
- **Ring**: Uses primary color for focus states

## Best Practices

1. **Use Primary Color Sparingly**: The primary color should be used for important actions and key interactive elements, not for all UI elements.

2. **Contrast**: Always ensure sufficient contrast when using the primary color. The primary-foreground color is automatically applied for text on primary backgrounds.

3. **Font Consistency**: Manrope is applied globally, so no additional font classes are needed unless you want to override it.

4. **Dark Mode**: The primary color is slightly adjusted in dark mode for better visibility and contrast.

## Examples

```tsx
// Primary button
<Button>Click me</Button>

// Primary text
<p className="text-primary">Important text</p>

// Primary border
<div className="border-primary border-2">...</div>

// Using Manrope (automatic, no class needed)
<p>This text uses Manrope automatically</p>
```

