import { Slot } from '@radix-ui/react-slot';
import { ReactNode } from 'react';

export const fixedHeightIcon = (icon: ReactNode, height: string) => {
  return (
    <div className="inline-flex justify-center items-center" style={{ height }}>
      <Slot className={'shrink-0'} data-slot="icon">
        {icon}
      </Slot>
    </div>
  );
};
