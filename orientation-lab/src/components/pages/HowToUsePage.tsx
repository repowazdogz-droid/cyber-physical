import { Card, Divider, Small } from "../ui";

export default function HowToUsePage() {
  return (
    <div style={{ maxWidth: 980 }}>
      <Card title="How to use">
        <div style={{ fontSize: 18, lineHeight: 1.5, marginTop: 6 }}>
          <b>Make disagreement legible in 60 seconds.</b>
        </div>

        <Divider />

        <div style={{ lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 10px" }}>
            This tool doesn't decide. It helps the room see what is actually happening: competing representations,
            contested assumptions, discriminators that would settle disputes, and unknowns with impact.
          </p>
          <p style={{ margin: 0 }}>
            <b>Don't use this to decide faster.</b> Use it to decide without pretending.
          </p>
        </div>

        <Divider />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card title="1) Capture">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              <li>Add 2–3 models (even if you disagree with one).</li>
              <li>Write the claim and the scope (what it ignores).</li>
              <li>Convert "noise" into explicit assumptions.</li>
            </ul>
          </Card>

          <Card title="2) Discriminate">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              <li>For each disagreement: write what would change minds.</li>
              <li>For each unknown: tag impact + time horizon.</li>
              <li>Name the judgment type (facts vs thresholds vs values vs authority).</li>
            </ul>
          </Card>

          <Card title="3) Own">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              <li>Assign owners as roles ("Safety lead", "Service director"), not people.</li>
              <li>Make residual uncertainty explicit.</li>
              <li>Mark what is governance (not analysis).</li>
            </ul>
          </Card>

          <Card title="4) Produce">
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
              <li>Switch to Artifact view and generate the room pack.</li>
              <li>Copy a share link for another room or approver.</li>
              <li>Export JSON if you need an audit trail.</li>
            </ul>
          </Card>
        </div>

        <Divider />

        <Card title="Room Mode">
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Project Room Mode for the group. Keep editing on your laptop. The prompts are non-directive: they do not
            recommend actions — they keep the room oriented.
          </p>
        </Card>

        <Divider />

        <Small>Boundary: Currently used as a thinking tool, not an operational system.</Small>
      </Card>
    </div>
  );
}
