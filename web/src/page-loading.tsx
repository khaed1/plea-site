import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { Icon, Notice, Title } from "./components";
import { useApp } from "./context";
import { homeLead, loadingLine, loadingTitle } from "./loading-text";
/** The first read's loading band for each route (round-2 X5), as the mockups' "Loading" reference
 * bands: a still skeleton under the page's real h1 and labels, with a line saying what is read. */
export function PageLoading({ page, id }: { page: string; id?: string }) {
  const { address } = useAccount();
  const { statics } = useApp();
  const home = ["", "how", "contracts"].includes(page),
    wall = page === "wall",
    // Read with the constants: alive or dead decides Home's title, lead and buttons (r2X-11).
    known = !!statics && statics["CabalGate.diedAt"] !== undefined,
    dead = known && !!statics!["CabalGate.diedAt"];
  // wall.html "Loading": five lines per card; three cards, two where the grid has two columns.
  const card = (key: number) => (
    <div key={key} className="panel skeleton" aria-hidden="true">
      <div className="skeleton__line skeleton__line--short" />
      <div className="skeleton__line" />
      <div className="skeleton__line" />
      <div className="skeleton__line skeleton__line--mid" />
      <div className="skeleton__line skeleton__line--short" />
    </div>
  );
  const line = (
    <p className="loading-label">
      <Icon name="hourglass" />
      {loadingLine(page, id, address)}
    </p>
  );
  if (home)
    return (
      <div className="page-loading stack stack--lg" aria-busy="true">
        <div className="split hero">
          <div className="stack stack--lg">
            <div>
              <div className="page-title">
                <h1 className="hero-title">
                  <span className="hero-line">Buying is open.</span> Selling{" "}
                  {dead ? (
                    "is open forever."
                  ) : (
                    <>
                      needs <span className="nowrap">a plea.</span>
                    </>
                  )}
                </h1>
              </div>
              {/* The loaded hero's own lead (r2X-11). It names the chain's panel size and top score,
                  and whether the Cabal is dead, which arrive with the constants a moment before the
                  snapshot; until then it is a still skeleton rather than a different sentence. */}
              {known ? (
                <p className="lead">{homeLead(statics!, dead)}</p>
              ) : (
                <div className="skeleton lead" aria-hidden="true">
                  <div className="skeleton__line" />
                  <div className="skeleton__line skeleton__line--mid" />
                </div>
              )}
            </div>
            <div className="btn-row">
              <a className="btn btn--primary" href="#/buy">
                {dead ? "Buy or sell PLEA" : `Buy ${statics?.symbol || "PLEA"}`}
              </a>
              <a className="btn" href={dead ? "#/wall" : "#/plead"}>
                {dead ? "See the Wall" : "Plead to sell"}
              </a>
            </div>
          </div>
          {/* Where the loaded hero's "Latest verdict" card goes. */}
          <div className="panel skeleton" aria-hidden="true">
            <div className="skeleton__line skeleton__line--short" />
            <div className="skeleton__block" />
            <div className="skeleton__line" />
            <div className="skeleton__line skeleton__line--mid" />
          </div>
        </div>
        {/* index.html "Live strip loading". */}
        <section className="section stack stack--sm" aria-label="Live numbers">
          {line}
          <div className="stats">
            {[
              "Price · 1M PLEA",
              "Market cap",
              "PLEA burned",
              "Pleas",
              "Season prize pot",
              "Cabal",
            ].map((label) => (
              <div className="stat" key={label}>
                <div className="stack stack--sm">
                  <span className="stat__label">{label}</span>
                  <div className="skeleton__line skeleton__line--mid" />
                  <div className="skeleton__line skeleton__line--short" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section__head">
            <h2>Latest verdicts</h2>
            <p className="meta">
              Newest plea first, read from the chain; times are when each plea
              was sent
            </p>
          </div>
          <div className="wall-grid wall-grid--loading">{[1, 2, 3].map(card)}</div>
        </section>
      </div>
    );
  // A profile path that is no address says so at once, as the loaded page does: there is
  // nothing to read (it read "Reading notanaddress’s balances…" first).
  if (page === "profile" && id && !isAddress(id, { strict: false }))
    return (
      <div className="page-loading stack stack--lg">
        <Title title="Profile" />
        <Notice kind="bad" title="That is not an address.">
          <p>
            Paste one that starts with 0x and has 40 more characters, 0–9 and
            a–f in either case.
          </p>
        </Notice>
      </div>
    );
  return (
    <div className="page-loading stack stack--lg">
      <Title title={loadingTitle(page, id, address)} />
      {wall ? (
        <div className="stack stack--sm" aria-busy="true">
          {line}
          <div className="wall-grid wall-grid--loading">{[1, 2, 3].map(card)}</div>
        </div>
      ) : (
        <div className="panel stack" aria-busy="true">
          {line}
          <div className="skeleton" aria-hidden="true">
            <div className="skeleton__line skeleton__line--short" />
            <div className="skeleton__block" />
            <div className="skeleton__line" />
            <div className="skeleton__line skeleton__line--mid" />
          </div>
        </div>
      )}
    </div>
  );
}
