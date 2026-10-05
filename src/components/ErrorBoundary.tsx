import React from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-100 p-8 text-center">
          <h1 className="text-xl font-black text-slate-900 mb-2">Algo salió mal en esta pantalla</h1>
          <p className="text-sm text-slate-500 mb-6">
            Tus datos están guardados. Recarga para continuar; si tu venta fue procesada la verás en el historial de ventas.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
