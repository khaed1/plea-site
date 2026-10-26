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
 * window.ethereum, plain Safari or Chrome do not. */
export const isMobileWithoutWallet = (userAgent: string, ethereum: unknown) =>
  /Android|iPhone|iPad|iPod/i.test(userAgent) && !ethereum;
