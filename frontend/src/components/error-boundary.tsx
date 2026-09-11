import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "sans-serif",
            background: "#0a0f1e",
            color: "#e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h2>
          <p style={{ color: "#94a3b8", maxWidth: "20rem", lineHeight: 1.6 }}>
            Please refresh the page. If the issue persists, try a different
            browser or clear your browser cache.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.75rem",
              borderRadius: "0.75rem",
              background: "#1e3a8a",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              border: "none",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
