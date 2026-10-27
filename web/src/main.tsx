import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { loadConfig } from "./config";
import { DataProvider } from "./context";
import { Icon } from "./components";
import "./design/tokens.css";
import "./design/components.css";
import "./site.css";
const root = createRoot(document.getElementById("root")!);
root.render(
  <main className="page main">
    <h1>PLEA</h1>
    <p>Loading the Sepolia deployment…</p>
  </main>,
);
// A failed load (one static file, or offline) tries again by itself: when the browser is back
// online, when the tab is shown again, and after 5, 10, 20, 40, then every 60 seconds (r2X-6).
let loading = false,
  failures = 0,
  timer: ReturnType<typeof setTimeout> | undefined;
const visible = () => {
  if (!document.hidden) start();
};
function start() {
  if (loading) return;
  loading = true;
  clearTimeout(timer);
  loadConfig().then(
    (r) => {
      window.removeEventListener("online", start);
      document.removeEventListener("visibilitychange", visible);
      root.render(
        <WagmiProvider config={r.walletConfig}>
          <QueryClientProvider client={new QueryClient()}>
            <DataProvider r={r}>
              <App />
            </DataProvider>
          </QueryClientProvider>
        </WagmiProvider>,
      );
    },
    () => {
      loading = false;
      timer = setTimeout(start, Math.min(60000, 5000 * 2 ** failures++));
      root.render(
        <main className="page main stack">
          <h1>PLEA</h1>
          <div className="error-box" role="alert">
            <p className="error-box__title">
              <Icon name="plugs" />
              Can’t load the deployment
            </p>
            <p className="small">
              The deployment configuration could not be loaded or verified.
              Transactions are disabled. The site tries again by itself.
            </p>
            <div className="btn-row">
              <button
                className="btn btn--sm"
                type="button"
                onClick={() => location.reload()}
              >
                <Icon name="arrow-clockwise" />
                Reload deployment
              </button>
            </div>
          </div>
        </main>,
      );
    },
  );
}
window.addEventListener("online", start);
document.addEventListener("visibilitychange", visible);
start();
