import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err, info) {
    console.error("ErrorBoundary:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Terjadi error di UI.</h2>
          <pre className="text-xs mt-2 p-3 bg-neutral-100 rounded text-neutral-800 overflow-auto">
            {String(this.state.err)}
          </pre>
          <button
            onClick={() => {
              localStorage.removeItem("mentor-dashboard-pro-v7");
              location.reload();
            }}
            className="mt-3 rounded-xl border px-3 py-2 hover:bg-neutral-50"
          >
            Reset Local Data
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
