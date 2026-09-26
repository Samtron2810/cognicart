import { Component, type ReactNode } from "react"
import { logger } from "../services/logger"

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error("React ErrorBoundary", { message: error.message, stack: error.stack, componentStack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] grid place-items-center px-4">
          <div className="max-w-md text-center rounded-2xl bg-white border border-red-200 p-8">
            <div className="font-bold text-red-700">Something went wrong</div>
            <div className="text-sm text-[#6b6b6b] mt-1">{this.state.error?.message || "Unexpected error"}</div>
            <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-bold text-white">Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
