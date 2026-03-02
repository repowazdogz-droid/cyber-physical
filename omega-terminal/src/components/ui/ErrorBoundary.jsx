import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("[ErrorBoundary]", error);
    console.error("[ErrorBoundary stack]", errorInfo?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 16, margin: 8,
          background: "#1a0808", border: "1px solid #f87171",
          borderRadius: 8, fontFamily: "monospace", fontSize: 12,
        }}>
          <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 8 }}>
            RENDER CRASH CAUGHT
          </div>
          <div style={{ color: "#ff9999", marginBottom: 8 }}>
            {this.state.error.toString()}
          </div>
          <pre style={{
            color: "#888", fontSize: 10, whiteSpace: "pre-wrap",
            maxHeight: 200, overflow: "auto",
          }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => this.setState({ error: null, errorInfo: null })}
            style={{
              marginTop: 8, padding: "4px 12px", fontSize: 11,
              background: "#333", color: "#fff", border: "none",
              borderRadius: 4, cursor: "pointer",
            }}
          >RETRY</button>
        </div>
      );
    }
    return this.props.children;
  }
}
