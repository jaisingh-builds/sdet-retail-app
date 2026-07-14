import assert from "node:assert/strict";
import test from "node:test";
import {
  cartTotalPaise,
  couponDiscountPaise,
  isSupportedCoupon,
  lineTotalPaise,
  normalizeCouponCode
} from "../../src/pricing.js";

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

test("UST10 applies an integer-paise ten percent discount", () => {
  assert.equal(normalizeCouponCode(" ust10 "), "UST10");
  assert.equal(isSupportedCoupon("ust10"), true);
  assert.equal(couponDiscountPaise(99800, "UST10"), 9980);
  assert.equal(couponDiscountPaise(999, "UST10"), 99);
});

test("unknown or missing coupon has no pricing effect", () => {
  assert.equal(isSupportedCoupon("SAVE10"), false);
  assert.equal(couponDiscountPaise(99800, "SAVE10"), 0);
  assert.equal(couponDiscountPaise(99800), 0);
});
