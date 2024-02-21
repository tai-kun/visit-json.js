import type {
  AndBreak,
  JsonArrayLike,
  JsonObjectLike,
  JsonPrimitiveLike,
  JsonValue,
  JsonValueLike,
  REMOVE,
  SKIP,
} from "./helpers"
import { BREAK, PASS } from "./helpers"

export type PathSegment = string | number

/**
 * Callback function for traversing JSON.
 *
 * @template T JSON value type.
 * @param value JSON value.
 * @param path path to the value.
 * @param parent parent object.
 * @returns new JSON value or helper object. `undefined` is treated as `PASS`.
 */
export type JsonVisitorFn<T extends JsonValueLike = JsonValueLike> = (
  value: T,
  path: readonly PathSegment[],
  parent: JsonArrayLike | JsonObjectLike | null,
) =>
  | AndBreak
  | JsonValue
  | (undefined | typeof PASS)
  | typeof SKIP
  | typeof BREAK
  | typeof REMOVE

/**
 * Callback functions to traversing each JSON value.
 */
export type JsonVisitor = {
  readonly Array?: JsonVisitorFn<JsonArrayLike> | undefined
  readonly Object?: JsonVisitorFn<JsonObjectLike> | undefined
  readonly Primitive?: JsonVisitorFn<JsonPrimitiveLike> | undefined
}

if (cfgTest && cfgTest.url === import.meta.url) {
  const { describe } = cfgTest

  describe("src/visitor", () => {
    // TODO: Type tests
  })
}
