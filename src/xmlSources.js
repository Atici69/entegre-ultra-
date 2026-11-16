import { auth, db } from './firebase.js';
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';

const DB_NAME = 'trend-entegre-local-data';
const STORE_NAME = 'xml_sources';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('Bu cihazda kalıcı XML kaynak depolaması desteklenmiyor.'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('XML kaynak veritabanı açılamadı.'));
  });
}
async function withStore(mode, action) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, mode);
    let result;
    try { result = action(tx.objectStore(STORE_NAME)); }
    catch (error) { database.close(); reject(error); return; }
    tx.oncomplete = () => { database.close(); resolve(result?.result); };
    tx.onerror = () => { database.close(); reject(tx.error || new Error('XML kaynak işlemi başarısız.')); };
    tx.onabort = () => { database.close(); reject(tx.error || new Error('XML kaynak işlemi iptal edildi.')); };
  });
}
const safeId = value => String(value).replaceAll('/', '_');

export async function listLocalXmlSources() {
  return (await withStore('readonly', store => store.getAll())) || [];
}
export async function listXmlSources() {
  const localRows = await listLocalXmlSources();
  const user = auth.currentUser;
  if (!user) return localRows;
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'xml_sources'));
  const merged = new Map(localRows.map(row => [String(row.id), row]));
  snapshot.docs.forEach(item => merged.set(String(item.id), { ...merged.get(String(item.id)), ...item.data() }));
  return [...merged.values()].map(({ products, ...row }) => row);
}
export async function getXmlSource(id) {
  const user = auth.currentUser;
  if (user) {
    const sourceRef = doc(db, 'users', user.uid, 'xml_sources', safeId(id));
    const sourceSnap = await getDoc(sourceRef);
    if (sourceSnap.exists()) {
      const productSnap = await getDocs(collection(sourceRef, 'products'));
      const products = productSnap.docs.map(item => item.data()).sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      return { id: sourceSnap.id, ...sourceSnap.data(), products };
    }
  }
  return withStore('readonly', store => store.get(id));
}
async function saveSourceToCloud(source, user) {
  const sourceRef = doc(db, 'users', user.uid, 'xml_sources', safeId(source.id));
  const products = source.products || [];
  for (let start = 0; start < products.length; start += 400) {
    const batch = writeBatch(db);
    products.slice(start, start + 400).forEach((product, index) => {
      batch.set(doc(sourceRef, 'products', safeId(product.id ?? start + index)), product);
    });
    await batch.commit();
  }
  const metadata = {
    id: String(source.id), name: source.name || 'XML Kaynağı',
    fileName: source.fileName || '', productCount: products.length,
    updatedAt: source.updatedAt || new Date().toISOString(),
    storageFormat: 'subcollection-v1'
  };
  const batch = writeBatch(db);
  batch.set(sourceRef, metadata, { merge: true });
  await batch.commit();
}
export async function saveXmlSource(source) {
  // Save locally first. A network failure never removes the existing source.
  await withStore('readwrite', store => store.put(source));
  if (auth.currentUser) await saveSourceToCloud(source, auth.currentUser);
  return source;
}
export async function migrateLocalXmlSources(user = auth.currentUser) {
  if (!user) return { migrated: 0, total: 0 };
  const localRows = await listLocalXmlSources();
  let migrated = 0;
  for (const source of localRows) {
    const sourceRef = doc(db, 'users', user.uid, 'xml_sources', safeId(source.id));
    const existing = await getDoc(sourceRef);
    if (!existing.exists()) {
      await saveSourceToCloud(source, user);
      migrated += 1;
    } else if (source.products?.length) {
      const existingProducts = await getDocs(collection(sourceRef, 'products'));
      if (existingProducts.empty) {
        await saveSourceToCloud(source, user);
        migrated += 1;
      }
    }
  }
  return { migrated, total: localRows.length };
}
export async function deleteXmlSource(id) {
  await withStore('readwrite', store => store.delete(id));
  // Cloud copies are retained during the initial migration to prevent accidental loss.
}
