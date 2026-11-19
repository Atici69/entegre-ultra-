import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './db.js';

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
  const email = String(req.body.email || '').trim().toLowerCase();
  const fullName = String(req.body.full_name || '').trim();
  const password = String(req.body.password || '');
  const storeName = String(req.body.store_name || '').trim();
  if (!emailPattern.test(email) || email.length > 190 || fullName.length < 2 || fullName.length > 190 || password.length < 10 || password.length > 128 || storeName.length < 2 || storeName.length > 190) {
    return res.status(400).json({ error: 'Valid email, name, store name and a password of at least 10 characters are required' });
  }
  const connection = await getPool().getConnection();
  try {
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
  } finally { connection.release(); }
});

router.post('/auth/login', async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
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

export { router as apiRouter, authenticate };
