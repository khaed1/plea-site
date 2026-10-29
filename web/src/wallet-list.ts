/** Which connectors the Connect sheet lists. wagmi's EIP-6963 connectors are type "injected" too,
 * each with its wallet's rdns as id; the generic one has id "injected" and wraps window.ethereum.
 * The generic one is hidden when a wallet announced itself (it would be listed twice) and on a phone
 * without window.ethereum (there is nothing behind it; the sheet offers "Open in …" links instead).
 * Every announced wallet stays listed, on a phone too (IMD4, r2X-5). */
export function listedConnectors<T extends { id: string; type: string }>(
  connectors: readonly T[],
  mobile: boolean,
) {
  const named = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  return connectors.filter((c) => c.id !== "injected" || (!named && !mobile));
}
/** A phone or tablet browser with no injected wallet: the wallet apps' in-app browsers set
 * window.ethereum, plain Safari or Chrome do not. iPadOS Safari in its default desktop mode sends
 * a Mac user agent: a "Mac" with a touch screen (navigator.maxTouchPoints > 1) is an iPad. */
export const isMobileWithoutWallet = (
  userAgent: string,
  ethereum: unknown,
  maxTouchPoints = 0,
) =>
  (/Android|iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) &&
  !ethereum;
/** Why connecting failed, in the Connect sheet: no wallet behind the generic connector (wagmi's
 * ProviderNotFoundError), a declined request, or else a plain retry line; never the transaction
 * texts of explainError (nothing is simulated or sent when connecting). */
export function connectErrorText(e: any) {
  const all = [e, e?.cause].filter(Boolean),
    text = all.map((x) => `${x?.name || ""} ${x?.message || ""}`).join(" ");
  if (/ProviderNotFound|provider not found|no provider/i.test(text))
    return "No browser wallet found. Install a wallet extension, or open this page in your wallet app’s browser.";
  if (all.some((x) => x?.code === 4001) || /user rejected|user denied/i.test(text))
    return "You declined the connection in your wallet. Nothing was shared; try again when ready.";
  if (all.some((x) => x?.code === -32002) || /already pending/i.test(text))
    return "Your wallet already has a connection request open. Finish it in the wallet.";
  return "The wallet did not connect. Try again, or choose another wallet.";
}
/** A storage for wagmi that never throws (it remembers the connected wallet between visits): a read that
 * throws reads nothing, and a write the browser refuses (storage full: QuotaExceededError; blocked) is
 * a convenience lost. wagmi's createStorage awaits these inside its own async calls, so a throw there
 * became an uncaught page error on every "wagmi.store" write (RC2-2). */
export function quietStorage(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {
  return {
    getItem(key: string) {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      try {
        storage.setItem(key, value);
      } catch {}
    },
    removeItem(key: string) {
      try {
        storage.removeItem(key);
      } catch {}
    },
  };
}
