import "@testing-library/jest-dom";

// Mock ResizeObserver for Recharts
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
