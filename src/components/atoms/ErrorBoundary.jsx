import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Log to console in development
    console.error("[Chronos] Uncaught error:", error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, info: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;

    return (
      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0E18",
        color: "#fff",
        padding: "24px 20px",
        textAlign: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "linear-gradient(135deg, #E05555 0%, #9B1C1C 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24, boxShadow: "0 12px 32px rgba(224,85,85,0.35)",
          fontSize: 32,
        }}>
          ⚡
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.4px" }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, maxWidth: 340, marginBottom: 28 }}>
          Chronos hit an unexpected error. Your data is safe in local storage — reload to continue.
        </div>

        {/* Error detail (collapsed) */}
        {error && (
          <details style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 24,
            maxWidth: 400,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
          }}>
            <summary style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: ".3px", textTransform: "uppercase" }}>
              Error details
            </summary>
            <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {error.toString()}
            </pre>
          </details>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #6366F1, #9B5DE5)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reload app
          </button>
          <button
            onClick={() => this.handleReset()}
            style={{
              padding: "12px 20px", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
