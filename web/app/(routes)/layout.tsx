import { Providers } from '@app/shared/providers';
import { UIRoot } from '@packages/ui/Root';

import { PageLayout } from '../components/PageLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIRoot>
      <Providers>
        <PageLayout>{children}</PageLayout>
      </Providers>
    </UIRoot>
  );
}
