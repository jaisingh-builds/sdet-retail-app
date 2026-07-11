import assert from "node:assert/strict";
import test from "node:test";
import { cartTotalPaise, lineTotalPaise } from "../../src/pricing.js";

test("line total uses integer paise", () => {
  assert.equal(lineTotalPaise(49900, 3), 149700);
});

test("cart total sums all line totals", () => {
  assert.equal(
    cartTotalPaise([
      { unitPricePaise: 49900, qty: 2 },
      { unitPricePaise: 9900, qty: 3 }
    ]),
    129500
  );
});
