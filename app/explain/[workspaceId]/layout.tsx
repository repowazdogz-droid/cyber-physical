import { WorkspaceProvider } from '@/app/state/WorkspaceContext';

export default async function ExplainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }> | { workspaceId: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { workspaceId } = resolvedParams;

  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      {children}
    </WorkspaceProvider>
  );
}

