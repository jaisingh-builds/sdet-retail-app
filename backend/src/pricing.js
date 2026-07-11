export function lineTotalPaise(unitPricePaise, quantity) {
  return Number(unitPricePaise) * Number(quantity);
}

export function cartTotalPaise(items) {
  return items.reduce(
    (total, item) => total + lineTotalPaise(item.unitPricePaise, item.qty),
    0
  );
}
