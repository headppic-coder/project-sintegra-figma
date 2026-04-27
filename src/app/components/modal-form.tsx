import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
}

export function ModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'lg'
}: ModalFormProps) {
  // Handle both predefined sizes and custom values
  const getMaxWidthClass = () => {
    const predefinedSizes: Record<string, string> = {
      'sm': 'max-w-sm',
      'md': 'max-w-md',
      'lg': 'max-w-lg',
      'xl': 'max-w-xl',
      '2xl': 'max-w-2xl',
    };

    // If it's a predefined size, use the mapping
    if (predefinedSizes[maxWidth]) {
      return predefinedSizes[maxWidth];
    }

    // For custom values like '70vw', add responsive classes
    if (maxWidth.includes('vw')) {
      return 'w-[95vw] md:w-[70vw] max-w-[95vw] md:max-w-[70vw]';
    }

    // Otherwise, return empty
    return '';
  };

  const maxWidthClass = getMaxWidthClass();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${maxWidthClass} max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs">{description}</DialogDescription>}
          {!description && <DialogDescription className="sr-only">Form untuk {title}</DialogDescription>}
        </DialogHeader>
        <div className="text-sm">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}