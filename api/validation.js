export function positiveId(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function decimalToMilli(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > 999999999) return null;
  const scaled = Math.round(number * 1000);
  return Math.abs(number * 1000 - scaled) < 1e-7 ? scaled : null;
}

export function parseStockMovement(body = {}) {
  const type = String(body.movement_type || '');
  if (!['in', 'out', 'adjustment'].includes(type)) return { error: 'Unsupported stock movement type' };
  const quantity = decimalToMilli(body.quantity);
  if (quantity === null || quantity === 0) return { error: 'quantity must be a non-zero number with at most 3 decimal places' };
  if (type !== 'adjustment' && quantity < 0) return { error: 'in/out quantity must be positive' };
  return { value: { type, quantityMilli: type === 'out' ? -quantity : quantity } };
}

export function parseVariant(body = {}) {
  const sku = body.variant_sku == null || body.variant_sku === '' ? null : String(body.variant_sku).trim();
  const barcode = body.barcode == null || body.barcode === '' ? null : String(body.barcode).trim();
  const price = body.sale_price == null || body.sale_price === '' ? null : Number(body.sale_price);
  const stock = body.stock_quantity == null || body.stock_quantity === '' ? 0 : Number(body.stock_quantity);
  const attributes = body.attributes == null ? null : body.attributes;
  if (sku && sku.length > 100) return { error: 'variant_sku is too long' };
  if (barcode && barcode.length > 100) return { error: 'barcode is too long' };
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: 'sale_price must be non-negative' };
  if (!Number.isFinite(stock) || stock < 0 || decimalToMilli(stock) === null) return { error: 'stock_quantity must be non-negative with at most 3 decimal places' };
  if (attributes !== null && (typeof attributes !== 'object' || Array.isArray(attributes))) return { error: 'attributes must be a JSON object' };
  if (attributes !== null && JSON.stringify(attributes).length > 10000) return { error: 'attributes is too large' };
  return { value: { sku, barcode, price, stock, attributes } };
}
