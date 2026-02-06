// Re-export all UI components for easier imports
// This encourages component reuse by providing a single import path

export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

export { Switch } from "./switch";

export { TypingAnimation } from "./typing-animation";
export { FAQAccordion } from "./faq-accordion";
export { ChevronIcon } from "./chevron-icon";