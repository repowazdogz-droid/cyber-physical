import React from "react";

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Orientation Lab error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#555" }}>
            The session data is safe. This view failed to render.
          </p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

