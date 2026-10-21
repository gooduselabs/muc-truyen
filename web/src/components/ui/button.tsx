import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white shadow-[0_8px_24px_-8px_var(--brand)] hover:brightness-110 hover:-translate-y-px',
        ink: 'bg-fg text-bg hover:opacity-90',
        outline: 'border border-line bg-card hover:border-brand hover:text-brand',
        ghost: 'hover:bg-bg-soft',
        soft: 'bg-brand-soft text-brand hover:brightness-95',
        gold: 'bg-gradient-to-r from-[#e0b052] to-[#c08a2b] text-white shadow-[0_8px_24px_-10px_#c08a2b] hover:brightness-110',
      },
      size: { default: 'h-10 px-5', sm: 'h-8 px-3.5 text-xs', lg: 'h-12 px-7 text-base', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';
