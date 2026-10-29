/** Diagram "contracts" (docs/15-contracts.md): PLEA's eight contracts on Ethereum and how they talk
 * to each other and to the outside (IMD's Intake, Uniswap v4's PoolManager, imd/acc's Stacker, the
 * IMD seat NFT), each link checked in src/ at the launch commit: PLEA._update reads the gate;
 * CabalGate._ask pays the Intake, onOracleResult takes its answer, unlockCallback sells through the
 * pool with the seller as the hook's trader, _payAppeal funds the wall; the Letterbox pleads with
 * submitFor / appealFor and sells with executeSellFor, pays the auto-sell fee to Seasons; the
 * Tribunal asks the Intake, reads the gate's question, books overruled stakes with
 * checkpointObjection, and Seasons reads its standing; PleaHook._payFees pays the owner, Seasons and
 * the Stacker and keeps the wall's share; Seasons reads the gate's result and the seat, flushToWall
 * funds the wall; PleaDistributor pays the owner's Merkle root; PleaLaunch wired PLEA, deployed the
 * hook, the Letterbox and the Tribunal from committed code, and opens trading. Under the drawing,
 * each address with its Etherscan and Sourcify links, the owner's, and the outside contracts' and the
 * oracle's signing key's with their Etherscan links (the addresses are numbers.json's: launch.json's
 * arguments, checked on chain). */
import { Icon } from "../../components";
import { useNumbers } from "../numbers-context";
import { Figure } from "../dg";

type Card = { name: string; key: string; what: string; links: string[] };
/** Outside PLEA, under the eight: launch.json's CabalGate, Seasons and PleaLaunch arguments. */
const OUTSIDE: { name: string; key: string }[] = [
  { name: "IMD", key: "addr_imd" },
  { name: "IMD's Intake", key: "addr_intake" },
  { name: "The oracle's signing key", key: "addr_oracle_signer" },
  { name: "Uniswap v4's PoolManager", key: "addr_pool_manager" },
  { name: "imd/acc's Stacker", key: "addr_stacker" },
  { name: "The IMD seat NFT", key: "addr_seat" },
];

/** One address row with its Etherscan link (and Sourcify's, for PLEA's own contracts). */
function AddressRow({ name, address, sourcify }: { name: string; address: string; sourcify?: boolean }) {
  const who = name.replace(/^The /, "the ");
  return (
    <div>
      <dt>
        <b>{name}</b>
      </dt>
      <dd className="stack stack--sm">
        <span className="addr">
          <span className="addr__text mono">{address}</span>
        </span>
        <span className="cluster cluster--sm small">
          <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer" className="docs-ext nowrap">
            Etherscan
            <Icon name="arrow-square-out" />
            <span className="sr-only"> for {who} (opens in a new tab)</span>
          </a>
          {sourcify && (
            <a href={`https://repo.sourcify.dev/1/${address}`} target="_blank" rel="noreferrer" className="docs-ext nowrap">
              Sourcify
              <Icon name="arrow-square-out" />
              <span className="sr-only"> for {who} (opens in a new tab)</span>
            </a>
          )}
        </span>
      </dd>
    </div>
  );
}

export default function Contracts() {
  const n = useNumbers(),
    t = n.text;
  const groups: { title: string; cards: Card[] }[] = [
    {
      title: "The token",
      cards: [
        {
          name: "PLEA",
          key: "addr_plea",
          what: `The token: ${t("total_supply")}, minted once.`,
          links: [
            "Asks CabalGate whether the Cabal lives. While it does, only the pool, the court's contracts and the owner's allowlist may send PLEA.",
          ],
        },
      ],
    },
    {
      title: "The court",
      cards: [
        {
          name: "CabalGate",
          key: "addr_gate",
          what: "Pleas, verdicts, appeals, sales and the dead-man.",
          links: [
            `Pays IMD's Intake the ${t("oracle_fee")} and asks the Cabal; the signed verdict comes back to it.`,
            "Reads PleaHook for your buy record and the hourly prices, for the fact score.",
            "Sells an approved plea in the pool, and sends an appeal's share to the buy wall.",
          ],
        },
        {
          name: "Letterbox",
          key: "addr_letterbox",
          what: "Letters and the auto-sell box: escrows and tips.",
          links: [
            "Pleads, appeals and sells through CabalGate for a letter's writer.",
            "Pays the auto-sell fee to Seasons.",
          ],
        },
        {
          name: "Tribunal",
          key: "addr_tribunal",
          what: "Objections and the second panel.",
          links: [
            "Reads the plea from CabalGate and asks IMD's Intake for a new score.",
            "Sends an overruled stake to Seasons, which waits for its ruling before recording points.",
          ],
        },
      ],
    },
    {
      title: "The market",
      cards: [
        {
          name: "PleaHook",
          key: "addr_hook",
          what: "The pool's hook on Uniswap v4: the only liquidity, every fee, the cap and the buy wall.",
          links: [
            `Pays the ${t("fee_cashback")} cashback through imd/acc's Stacker, ${t("fee_owner")} to the owner and ${t("fee_prize")} to Seasons.`,
            "Asks PLEA whether the Cabal lives, to gate sales.",
          ],
        },
      ],
    },
    {
      title: "The prizes",
      cards: [
        {
          name: "Seasons",
          key: "addr_seasons",
          what: `Points, the leaderboard, the prize pots and the ${t("bonus_total")} bonus.`,
          links: [
            "Reads verdicts from CabalGate and seats from the IMD seat NFT.",
            "After the death, sends what is left to PleaHook's buy wall.",
          ],
        },
      ],
    },
    {
      title: "The launch",
      cards: [
        {
          name: "PleaLaunch",
          key: "addr_launch",
          what: "Wired the others at the launch, and opens trading.",
          links: ["Deployed PleaHook, the Letterbox and the Tribunal from code fixed at the launch."],
        },
        {
          name: "PleaDistributor",
          key: "addr_distributor",
          what: `The claim list: ${t("supply_distributor")}.`,
          links: ["Pays the wallets on the list the owner sets, once."],
        },
      ],
    },
  ];
  const cards = groups.flatMap((g) => g.cards);
  const outside = "IMD's Intake (the Cabal's judges), Uniswap v4's PoolManager, imd/acc's Stacker, the IMD seat NFT";
  const alt =
    "PLEA's eight contracts and how they connect. " +
    groups
      .map((g) => `${g.title}: ` + g.cards.map((c) => `${c.name}. ${c.what} ${c.links.join(" ")}`).join(" "))
      .join(" ") +
    ` Outside PLEA: ${outside}.`;
  return (
    <Figure
      title="Eight contracts, and who talks to whom"
      alt={alt}
      after={
        <div className="stack stack--sm">
          <p className="small text-2">
            The addresses on Ethereum, each with its page on Etherscan and its verified source on Sourcify, and the
            owner's wallet.
          </p>
          <dl className="addr-list dg-addrs">
            {cards.map((c) => (
              <AddressRow key={c.name} name={c.name} address={t(c.key)} sourcify />
            ))}
            <AddressRow name="The owner" address={t("owner")} />
          </dl>
          <p className="small text-2">
            Outside PLEA: the contracts it works with, and the key that signs the judges' answers.
          </p>
          <dl className="addr-list dg-addrs">
            {OUTSIDE.map((o) => (
              <AddressRow key={o.key} name={o.name} address={t(o.key)} />
            ))}
          </dl>
        </div>
      }
    >
      <div className="dg-groups">
        {groups.map((g) => (
          <div className="dg-group" key={g.title}>
            <span className="dg-group__title">{g.title}</span>
            {g.cards.map((c) => (
              <div className="dg-node" key={c.name}>
                <span className="dg-node__head">
                  <span className="mono">{c.name}</span>
                </span>
                <span className="dg-node__text">{c.what}</span>
                <ul className="dg-links">
                  {c.links.map((l) => (
                    <li key={l}>
                      <Icon name="arrow-right" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="dg-band">
        <Icon name="plugs" />
        <p>
          <b>Outside PLEA:</b> {outside}.
        </p>
      </div>
    </Figure>
  );
}
