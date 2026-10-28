import { Providers } from '@app/shared/providers';
import { UIRoot } from '@packages/ui/Root';

import { PageErrorBoundary } from '../components/PageErrorBoundary';
import { PageLayout } from '../components/PageLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIRoot>
      <PageErrorBoundary>
        <Providers>
          <PageLayout>{children}</PageLayout>
        </Providers>
      </PageErrorBoundary>
    </UIRoot>
  );
}
