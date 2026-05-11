import { Component, type ReactNode, Suspense, lazy } from 'react';

function GradientFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #3a2410 0%, #0f0d0b 50%, #1a1208 100%)',
        backgroundImage: `
          radial-gradient(ellipse at 20% 50%, #3a2410 0%, #0f0d0b 50%, #1a1208 100%),
          radial-gradient(circle at 15% 25%, rgba(212,168,68,0.2) 0%, transparent 45%),
          radial-gradient(circle at 80% 65%, rgba(138,90,25,0.15) 0%, transparent 45%)
        `,
      }}
    />
  );
}

const ThreeScene = lazy(() =>
  import('./ThreeScene').catch(() => ({
    default: () => <GradientFallback />,
  }))
);

interface ErrorBoundaryState { hasError: boolean }

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function ThreeBackground() {
  return (
    <WebGLErrorBoundary fallback={<GradientFallback />}>
      <Suspense fallback={<GradientFallback />}>
        <ThreeScene />
      </Suspense>
    </WebGLErrorBoundary>
  );
}
