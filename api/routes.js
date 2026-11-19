import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './db.js';
import { positiveId, parseStockMovement, parseVariant, decimalToMilli, parseOrderDraft } from './validation.js';

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tokenFor(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return jwt.sign({ sub: String(user.id), role: user.role }, secret, { expiresIn: '12h', issuer: 'entegre-ultra-api', audience: 'entegre-ultra' });
}

function authenticate(req, res, next) {
  const value = req.get('authorization') || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) return res.status(503).json({ error: 'Authentication is not configured' });
    req.auth = jwt.verify(token, secret, { issuer: 'entegre-ultra-api', audience: 'entegre-ultra' });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function ownedStore(req, res, next) {
  const storeId = Number(req.params.storeId || req.body.store_id);
  if (!Number.isSafeInteger(storeId) || storeId < 1) return res.status(400).json({ error: 'Valid store_id is required' });
  try {
    const [rows] = await getPool().execute(
      'SELECT id FROM stores WHERE id = ? AND owner_user_id = ? AND status = \'active\' LIMIT 1',
      [storeId, Number(req.auth.sub)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    req.storeId = storeId;
    next();
  } catch (error) { next(error); }
}

router.post('/auth/register', async (req, res, next) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ error: 'Authentication is not configured' });
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.full_name || '').trim();
  const password = String(body.password || '');
  const storeName = String(body.store_name || '').trim();
  if (!emailPattern.test(email) || email.length > 190 || fullName.length < 2 || fullName.length > 190 || password.length < 10 || password.length > 128 || storeName.length < 2 || storeName.length > 190) {
    return res.status(400).json({ error: 'Valid email, name, store name and a password of at least 10 characters are required' });
  }
  let connection;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [userResult] = await connection.execute(
      'INSERT INTO users (auth_provider, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      ['local', email, fullName, passwordHash, 'customer']
    );
    const [storeResult] = await connection.execute(
      'INSERT INTO stores (owner_user_id, name) VALUES (?, ?)',
      [userResult.insertId, storeName]
    );
    await connection.commit();
    const user = { id: userResult.insertId, email, full_name: fullName, role: 'customer' };
    return res.status(201).json({ token: tokenFor(user), user, store: { id: storeResult.insertId, name: storeName } });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally { if (connection) connection.release(); }
});

router.post('/auth/login', async (req, res, next) => {
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  try {
    const [rows] = await getPool().execute(
      'SELECT id, email, full_name, role, status, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];
    if (!user || user.status !== 'active' || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    return res.json({
      token: tokenFor(user),
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
    });
  } catch (error) { return next(error); }
});

router.get('/auth/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await getPool().execute(
      'SELECT id, email, full_name, role, status FROM users WHERE id = ? LIMIT 1',
      [Number(req.auth.sub)]
    );
    if (!rows.length || rows[0].status !== 'active') return res.status(401).json({ error: 'Account is unavailable' });
    return res.json({ user: rows[0] });
  } catch (error) { return next(error); }
});

router.get('/stores', authenticate, async (req, res, next) => {
  try {
    const [rows] = await getPool().execute(
      'SELECT id, name, legal_name, status, created_at FROM stores WHERE owner_user_id = ? ORDER BY id DESC',
      [Number(req.auth.sub)]
    );
    return res.json({ stores: rows });
  } catch (error) { return next(error); }
});

router.get('/stores/:storeId/products', authenticate, ownedStore, async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const [rows] = await getPool().execute(
      'SELECT id, sku, barcode, name, sale_price, currency, stock_quantity, status, created_at, updated_at FROM products WHERE store_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [req.storeId, limit, offset]
    );
    return res.json({ products: rows, limit, offset });
  } catch (error) { return next(error); }
});

router.post('/stores/:storeId/products', authenticate, ownedStore, async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const sku = req.body.sku ? String(req.body.sku).trim() : null;
  const barcode = req.body.barcode ? String(req.body.barcode).trim() : null;
  const price = Number(req.body.sale_price);
  const stock = Number(req.body.stock_quantity ?? 0);
  if (!name || name.length > 255 || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
    return res.status(400).json({ error: 'Product name, non-negative sale_price and stock_quantity are required' });
  }
  try {
    const [result] = await getPool().execute(
      'INSERT INTO products (store_id, sku, barcode, name, sale_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [req.storeId, sku, barcode, name, price, stock]
    );
    return res.status(201).json({ product: { id: result.insertId, store_id: req.storeId, sku, barcode, name, sale_price: price, stock_quantity: stock } });
  } catch (error) { return next(error); }
});

router.patch('/stores/:storeId/products/:productId', authenticate, ownedStore, async (req, res, next) => {
  const productId = Number(req.params.productId);
  if (!Number.isSafeInteger(productId) || productId < 1) return res.status(400).json({ error: 'Invalid product id' });
  const allowed = ['sku', 'barcode', 'name', 'sale_price', 'stock_quantity', 'status'];
  const fields = allowed.filter((key) => Object.hasOwn(req.body, key));
  if (!fields.length) return res.status(400).json({ error: 'No supported fields supplied' });
  const values = [];
  const sets = [];
  for (const field of fields) {
    let value = req.body[field];
    if (field === 'name') {
      value = String(value || '').trim();
      if (!value || value.length > 255) return res.status(400).json({ error: 'Invalid product name' });
    }
    if (field === 'sale_price' || field === 'stock_quantity') {
      value = Number(value);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: `Invalid ${field}` });
    }
    if (field === 'status' && !['active', 'passive', 'archived'].includes(value)) return res.status(400).json({ error: 'Invalid product status' });
    sets.push(`${field} = ?`);
    values.push(value);
  }
  values.push(productId, req.storeId);
  try {
    const [result] = await getPool().execute(
      `UPDATE products SET ${sets.join(', ')} WHERE id = ? AND store_id = ?`,
      values
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    return res.json({ ok: true });
  } catch (error) { return next(error); }
});


router.get('/stores/:storeId/products/:productId/variants', authenticate, ownedStore, async (req, res, next) => {
  const productId = positiveId(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const [rows] = await getPool().execute(
      'SELECT v.id, v.product_id, v.variant_sku, v.barcode, v.attributes, v.sale_price, v.stock_quantity, v.created_at, v.updated_at FROM product_variants v INNER JOIN products p ON p.id = v.product_id WHERE v.product_id = ? AND p.store_id = ? ORDER BY v.id DESC',
      [productId, req.storeId]
    );
    return res.json({ variants: rows });
  } catch (error) { return next(error); }
});

router.post('/stores/:storeId/products/:productId/variants', authenticate, ownedStore, async (req, res, next) => {
  const productId = positiveId(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'Invalid product id' });
  const parsed = parseVariant(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  let connection;
  let transactionStarted = false;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [products] = await connection.execute(
      'SELECT id FROM products WHERE id = ? AND store_id = ? FOR UPDATE',
      [productId, req.storeId]
    );
    if (!products.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'Product not found' });
    }
    const v = parsed.value;
    const [result] = await connection.execute(
      'INSERT INTO product_variants (product_id, variant_sku, barcode, attributes, sale_price, stock_quantity) VALUES (?, ?, ?, ?, ?, 0)',
      [productId, v.sku, v.barcode, v.attributes === null ? null : JSON.stringify(v.attributes), v.price]
    );
    if (v.stock > 0) {
      await connection.execute(
        'UPDATE product_variants SET stock_quantity = ? WHERE id = ?',
        [v.stock, result.insertId]
      );
      await connection.execute(
        'INSERT INTO stock_movements (store_id, product_id, variant_id, movement_type, quantity, reference_type, reference_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.storeId, productId, result.insertId, 'in', v.stock, 'variant_initial_stock', String(result.insertId), 'Initial variant stock']
      );
    }
    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({
      variant: { id: result.insertId, product_id: productId, variant_sku: v.sku, barcode: v.barcode, attributes: v.attributes, sale_price: v.price, stock_quantity: v.stock }
    });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    return next(error);
  } finally { if (connection) connection.release(); }
});

router.get('/stores/:storeId/products/:productId/stock-movements', authenticate, ownedStore, async (req, res, next) => {
  const productId = positiveId(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'Invalid product id' });
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  try {
    const [rows] = await getPool().execute(
      'SELECT id, product_id, variant_id, movement_type, quantity, reference_type, reference_id, note, created_at FROM stock_movements WHERE product_id = ? AND store_id = ? ORDER BY id DESC LIMIT ?',
      [productId, req.storeId, limit]
    );
    return res.json({ movements: rows, limit });
  } catch (error) { return next(error); }
});

router.post('/stores/:storeId/products/:productId/stock-movements', authenticate, ownedStore, async (req, res, next) => {
  const productId = positiveId(req.params.productId);
  if (!productId) return res.status(400).json({ error: 'Invalid product id' });
  const parsed = parseStockMovement(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const variantId = req.body?.variant_id == null || req.body.variant_id === '' ? null : positiveId(req.body.variant_id);
  if (req.body?.variant_id != null && req.body.variant_id !== '' && !variantId) {
    return res.status(400).json({ error: 'Invalid variant_id' });
  }
  const note = req.body?.note == null ? null : String(req.body.note).trim();
  if (note && note.length > 500) return res.status(400).json({ error: 'note is too long' });
  let connection;
  let transactionStarted = false;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const [products] = await connection.execute(
      'SELECT id, stock_quantity FROM products WHERE id = ? AND store_id = ? FOR UPDATE',
      [productId, req.storeId]
    );
    if (!products.length) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({ error: 'Product not found' });
    }
    let currentMilli;
    let updateSql;
    let updateParams;
    if (variantId) {
      const [variants] = await connection.execute(
        'SELECT id, stock_quantity FROM product_variants WHERE id = ? AND product_id = ? FOR UPDATE',
        [variantId, productId]
      );
      if (!variants.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({ error: 'Variant not found' });
      }
      currentMilli = decimalToMilli(variants[0].stock_quantity);
      updateSql = 'UPDATE product_variants SET stock_quantity = ? WHERE id = ?';
      updateParams = [null, variantId];
    } else {
      currentMilli = decimalToMilli(products[0].stock_quantity);
      updateSql = 'UPDATE products SET stock_quantity = ? WHERE id = ? AND store_id = ?';
      updateParams = [null, productId, req.storeId];
    }
    if (currentMilli === null) throw new Error('Stored stock quantity has unsupported precision');
    const nextMilli = currentMilli + parsed.value.quantityMilli;
    if (nextMilli < 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({ error: 'Insufficient stock for this movement' });
    }
    updateParams[0] = nextMilli / 1000;
    await connection.execute(updateSql, updateParams);
    const signedQuantity = parsed.value.quantityMilli / 1000;
    const [movement] = await connection.execute(
      'INSERT INTO stock_movements (store_id, product_id, variant_id, movement_type, quantity, note) VALUES (?, ?, ?, ?, ?, ?)',
      [req.storeId, productId, variantId, parsed.value.type, signedQuantity, note]
    );
    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({
      movement: { id: movement.insertId, product_id: productId, variant_id: variantId, movement_type: parsed.value.type, quantity: signedQuantity, resulting_stock: nextMilli / 1000 }
    });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    return next(error);
  } finally { if (connection) connection.release(); }
});


router.get('/stores/:storeId/orders', authenticate, ownedStore, async (req, res, next) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  try {
    const [rows] = await getPool().execute(
      'SELECT id, external_order_id, order_status, currency, subtotal, shipping_total, commission_total, grand_total, ordered_at, created_at FROM orders WHERE store_id = ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [req.storeId, limit, offset]
    );
    return res.json({ orders: rows, limit, offset });
  } catch (error) { return next(error); }
});

router.get('/stores/:storeId/orders/:orderId', authenticate, ownedStore, async (req, res, next) => {
  const orderId = positiveId(req.params.orderId);
  if (!orderId) return res.status(400).json({ error: 'Invalid order id' });
  try {
    const [orders] = await getPool().execute(
      'SELECT id, external_order_id, order_status, currency, subtotal, shipping_total, commission_total, grand_total, ordered_at, created_at FROM orders WHERE id = ? AND store_id = ? LIMIT 1',
      [orderId, req.storeId]
    );
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await getPool().execute(
      'SELECT id, product_id, external_product_id, product_name, sku, quantity, unit_price, line_total FROM order_items WHERE order_id = ? ORDER BY id',
      [orderId]
    );
    return res.json({ order: orders[0], items });
  } catch (error) { return next(error); }
});

router.post('/stores/:storeId/orders', authenticate, ownedStore, async (req, res, next) => {
  const parsed = parseOrderDraft(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  let connection;
  let transactionStarted = false;
  try {
    connection = await getPool().getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    const productSnapshots = [];
    for (const item of parsed.value.items) {
      const [products] = await connection.execute(
        'SELECT id, name, sku FROM products WHERE id = ? AND store_id = ? AND status = ? FOR UPDATE',
        [item.productId, req.storeId, 'active']
      );
      if (!products.length) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(400).json({ error: `Product ${item.productId} is unavailable in this store` });
      }
      productSnapshots.push(products[0]);
    }
    const order = parsed.value;
    const [result] = await connection.execute(
      'INSERT INTO orders (store_id, order_status, currency, subtotal, shipping_total, grand_total, ordered_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [req.storeId, 'new', order.currency, order.subtotal, order.shippingTotal, order.grandTotal]
    );
    for (let index = 0; index < order.items.length; index += 1) {
      const item = order.items[index];
      const product = productSnapshots[index];
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, product.id, product.name, product.sku, item.quantity, item.unitPrice, item.lineTotal]
      );
    }
    await connection.commit();
    transactionStarted = false;
    return res.status(201).json({
      order: {
        id: result.insertId,
        store_id: req.storeId,
        order_status: 'new',
        currency: order.currency,
        subtotal: order.subtotal,
        shipping_total: order.shippingTotal,
        grand_total: order.grandTotal
      }
    });
  } catch (error) {
    if (connection && transactionStarted) await connection.rollback();
    return next(error);
  } finally { if (connection) connection.release(); }
});

export { router as apiRouter, authenticate };
