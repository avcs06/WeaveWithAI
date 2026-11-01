import { Providers } from '@app/shared/providers';
import { UIRoot } from '@packages/ui/Root';

import { PageErrorBoundary } from '../components/PageErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIRoot>
      <PageErrorBoundary>
        {/* Each route group's layout frames its own pages; the root adds no frame of its own. */}
        <Providers>{children}</Providers>
      </PageErrorBoundary>
    </UIRoot>
  );
}
