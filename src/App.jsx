import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import MentorDashboardPro from "./MentorDashboardPro";
import "./index.css";

export default function App() {
  return (
    <ErrorBoundary>
      <MentorDashboardPro />
    </ErrorBoundary>
  );
}
