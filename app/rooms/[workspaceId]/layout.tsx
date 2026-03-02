import { WorkspaceProvider } from '@/app/state/WorkspaceContext';
import { SourcePanel } from './SourcePanel';
import { GuideOverlay } from '../GuideOverlay';
import { WhyThisHelpsStrip } from '../WhyThisHelpsStrip';
import { RoomHeader } from './RoomHeader';
import RoomTabs from '../RoomTabs';
import ExportButton from '../ExportButton';

export default async function WorkspaceLayout({
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
      <GuideOverlay />
      <WhyThisHelpsStrip />
      <RoomHeader workspaceId={workspaceId} />
      <div className="site-nav">
        <div className="site-nav-inner">
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Omega RC</div>
          <RoomTabs />
          <ExportButton />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 60px)' }}>
        <div
          style={{
            borderRight: '1px solid #e5e5e5',
            padding: '1.5rem',
            backgroundColor: '#fafafa',
          }}
        >
          <h2 className="site-h3" style={{ marginBottom: '1rem' }}>
            {workspaceId}
          </h2>
          <SourcePanel />
        </div>
        <div style={{ padding: '1.5rem', overflow: 'auto' }}>{children}</div>
      </div>
    </WorkspaceProvider>
  );
}

