export function renderAudit(): string {
  return `
  <div class="doc">
    <h1 class="docH1">Submit a system for assessment</h1>

    <p class="muted">
      Use this intake to scope an OMEGA-F assessment request.
      Submissions are handled manually. This form does not transmit data.
    </p>

    <form id="auditForm" class="auditForm">
      <label>
        System name
        <input name="systemName" required />
      </label>

      <label>
        Domain
        <input name="domain" placeholder="e.g., frontier model API, payments, autonomy" />
      </label>

      <label>
        Stage
        <select name="stage">
          <option>Proposed</option>
          <option>Live</option>
          <option>Post-incident</option>
        </select>
      </label>

      <label>
        Who operates it?
        <input name="operator" />
      </label>

      <label>
        Who can halt it?
        <input name="halt" />
      </label>

      <label>
        Who bears harm if it fails?
        <input name="bearer" />
      </label>

      <label>
        Fastest plausible harm (one sentence)
        <input name="harm" />
      </label>

      <label>
        Existing governance artifacts
        <textarea name="governance" placeholder="Dashboards, committees, audits"></textarea>
      </label>

      <fieldset class="checkboxGroup">
        <legend>Desired outputs</legend>
        <label><input type="checkbox" name="outputs" value="Board memo" /> Board memo</label>
        <label><input type="checkbox" name="outputs" value="Regulator / assurance note" /> Regulator / assurance note</label>
        <label><input type="checkbox" name="outputs" value="Go / No-Go gate" /> Go / No-Go gate</label>
        <label><input type="checkbox" name="outputs" value="Incident post-mortem" /> Incident post-mortem</label>
        <label><input type="checkbox" name="outputs" value="Room brief" /> Room brief</label>
      </fieldset>

      <fieldset class="checkboxGroup">
        <legend>Audience sensitivity</legend>
        <label><input type="radio" name="audience" value="Board" checked /> Board</label>
        <label><input type="radio" name="audience" value="Regulator" /> Regulator</label>
        <label><input type="radio" name="audience" value="Mixed" /> Mixed</label>
      </fieldset>

      <div class="actions">
        <button type="button" id="generateMemo">Generate intake memo</button>
      </div>
    </form>

    <section id="memoSection" hidden>
      <h2>Intake memorandum (copy)</h2>
      <pre id="memoOutput" class="plainBlock"></pre>
      <button id="copyMemo">Copy memorandum</button>
    </section>
  </div>
  `;
}
