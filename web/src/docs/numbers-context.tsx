/** The docs' numbers for the page and its diagrams. Docs.tsx provides the chain's constants once they
 * have loaded; until then (and in the unit tests) every number is numbers.json's own. A diagram reads
 * them with useNumbers(): text("pass_mark") is what {{pass_mark}} prints, value("pass_mark") the raw
 * number (69n) for its arithmetic. */
import { createContext, useContext } from "react";
import NUMBERS_JSON from "./numbers.json";
import { numberValue, numberWords, type Numbers } from "./numbers";

export const NUMBERS = NUMBERS_JSON as unknown as Numbers;
export type NumberReader = {
  /** What {{key}} prints. An unknown key throws: the build and the tests refuse it first. */
  text: (key: string) => string;
  /** The raw value (wei, seconds, bps, a count), or undefined for a number with none. */
  value: (key: string) => bigint | undefined;
};
export function readerFor(constants?: Record<string, unknown>): NumberReader {
  return {
    text: (key) => {
      const t = numberWords(NUMBERS, key, constants);
      if (t === undefined) throw Error(`The docs name an unknown number {{${key}}}.`);
      return t;
    },
    value: (key) => {
      if (!(key in NUMBERS) || key === "_meta") throw Error(`The docs name an unknown number {{${key}}}.`);
      return numberValue(NUMBERS, key, constants);
    },
  };
}
const Context = createContext<NumberReader>(readerFor());
export const NumbersProvider = Context.Provider;
export const useNumbers = () => useContext(Context);
