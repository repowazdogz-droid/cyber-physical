// app/admin/fault-episodes/page.tsx

import Link from "next/link";
import { listFaultEpisodeIds } from "@/spine/sim/listFaultEpisodes";
import { Container } from "../../(site)/components/Container";
import { Section } from "../../(site)/components/Section";
import UiCard from "../../ui/UiCard";
const Card = UiCard;

export default async function FaultEpisodesListPage() {
  // listFaultEpisodeIds() handles missing directory gracefully (returns [])
  const episodeIds = await listFaultEpisodeIds();

  return (
    <Section>
      <Container>
        <div>
          <h1 className="h1">Fault Episodes</h1>
          <p className="p-muted">
            Deterministic fault episode simulations. Read-only viewer.
          </p>
        </div>

        <div className="stack" style={{ marginTop: "var(--s-5)" }}>
          {episodeIds.length === 0 ? (
            <Card>
              <p className="p">No fault episodes found.</p>
              <p className="p-muted">
                Run <code className="mono">npm run fault:episode</code> to generate episode_001.
              </p>
            </Card>
          ) : (
            episodeIds.map((episodeId) => (
              <Card key={episodeId} variant="elevated">
                <div className="row-between">
                  <div>
                    <div className="kicker">{episodeId}</div>
                    <p className="p-muted">Fault episode simulation</p>
                  </div>
                  <Link
                    href={`/admin/fault-episodes/${episodeId}`}
                    className="btn"
                    style={{ textDecoration: "none" }}
                  >
                    View →
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </Container>
    </Section>
  );
}

