export function head(_title: string) {
  // Note: title is set in HTML files; this is kept for potential future use
  return "";
}

export function masthead() {
  return `
  <div class="masthead">
    <div class="brand">
      <h1>OMEGA-F</h1>
      <p>Structural governability determinations.</p>
    </div>
    <nav class="nav" aria-label="Primary">
      <a href="/" data-path="/">Home</a>
      <a href="/determinations/" data-path="/determinations">Determinations</a>
      <a href="/methodology/" data-path="/methodology">Method</a>
      <a href="/archive/" data-path="/archive">Archive</a>
      <a href="/audit/" data-path="/audit">Audit</a>
      <a href="/about/" data-path="/about">About</a>
    </nav>
  </div>
  <hr />
`;
}

export function footer() {
  const year = new Date().getFullYear();
  return `
  <div class="footer">
    <div>© ${year} OMEGA-F. Published as a matter of record.</div>
    <div class="right">
      <a href="/contact/">Contact</a>
    </div>
  </div>
`;
}

export function foot() {
  return "";
}

