export function lineTotalPaise(unitPricePaise, quantity) {
  return Number(unitPricePaise) * Number(quantity);
}

export function cartTotalPaise(items) {
  return items.reduce(
    (total, item) => total + lineTotalPaise(item.unitPricePaise, item.qty),
    0
  );
}

export function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function couponDiscountPaise(subtotalPaise, couponCode) {
  return normalizeCouponCode(couponCode) === "UST10"
    ? Math.floor(Number(subtotalPaise) * 10 / 100)
    : 0;
}

export function isSupportedCoupon(couponCode) {
  return normalizeCouponCode(couponCode) === "UST10";
}
