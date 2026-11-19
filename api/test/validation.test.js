import test from 'node:test';
import assert from 'node:assert/strict';
import { decimalToMilli, parseStockMovement, parseVariant, positiveId } from '../validation.js';

test('positiveId accepts only positive safe integers', () => {
  assert.equal(positiveId('12'), 12);
  assert.equal(positiveId('0'), null);
  assert.equal(positiveId('1.2'), null);
  assert.equal(positiveId('9007199254740992'), null);
});

test('stock movement converts directions to signed milli-units', () => {
  assert.deepEqual(parseStockMovement({ movement_type: 'in', quantity: '2.125' }), {
    value: { type: 'in', quantityMilli: 2125 }
  });
  assert.deepEqual(parseStockMovement({ movement_type: 'out', quantity: 2 }), {
    value: { type: 'out', quantityMilli: -2000 }
  });
  assert.deepEqual(parseStockMovement({ movement_type: 'adjustment', quantity: -1.5 }), {
    value: { type: 'adjustment', quantityMilli: -1500 }
  });
});

test('stock movement rejects invalid precision, zero and unsupported types', () => {
  assert.ok(parseStockMovement({ movement_type: 'in', quantity: 0 }).error);
  assert.ok(parseStockMovement({ movement_type: 'out', quantity: -1 }).error);
  assert.ok(parseStockMovement({ movement_type: 'reserve', quantity: 1 }).error);
  assert.ok(parseStockMovement({ movement_type: 'in', quantity: 1.0001 }).error);
});

test('variant validation normalizes optional fields and accepts JSON attributes', () => {
  assert.deepEqual(parseVariant({
    variant_sku: ' BLUE-M ',
    barcode: '123',
    sale_price: '149.90',
    stock_quantity: '3.5',
    attributes: { color: 'blue', size: 'M' }
  }), {
    value: {
      sku: 'BLUE-M',
      barcode: '123',
      price: 149.9,
      stock: 3.5,
      attributes: { color: 'blue', size: 'M' }
    }
  });
});

test('variant validation rejects negative price, malformed attributes and excessive precision', () => {
  assert.ok(parseVariant({ sale_price: -1 }).error);
  assert.ok(parseVariant({ attributes: ['not', 'an object'] }).error);
  assert.ok(parseVariant({ stock_quantity: 1.2345 }).error);
  assert.ok(parseVariant({ attributes: { data: 'x'.repeat(10001) } }).error);
});

test('decimalToMilli preserves three decimal places exactly', () => {
  assert.equal(decimalToMilli('0.125'), 125);
  assert.equal(decimalToMilli('4'), 4000);
  assert.equal(decimalToMilli('0.0001'), null);
});
