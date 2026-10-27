import { createContext, useContext } from 'react';

import type { TooltipController } from './controller';

type TooltipContextValue = { controller: TooltipController };

export const TooltipContext = createContext<TooltipContextValue | null>(null);

export const useTooltipContext = () => {
  const context = useContext(TooltipContext);
  if (!context)
    throw new Error('Tooltip needs a TooltipProvider; UIRoot has one');
  return context;
};
