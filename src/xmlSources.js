const DB_NAME = 'trend-entegre-local-data';
const STORE_NAME = 'xml_sources';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Bu cihazda kalıcı XML kaynak depolaması desteklenmiyor.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('XML kaynak veritabanı açılamadı.'));
  });
}

async function withStore(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let result;
    try { result = action(store); }
    catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('XML kaynak işlemi başarısız.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('XML kaynak işlemi iptal edildi.')); };
  });
}

export async function listXmlSources() {
  return (await withStore('readonly', store => store.getAll())) || [];
}

export async function getXmlSource(id) {
  return withStore('readonly', store => store.get(id));
}

export async function saveXmlSource(source) {
  await withStore('readwrite', store => store.put(source));
  return source;
}

export async function deleteXmlSource(id) {
  await withStore('readwrite', store => store.delete(id));
}
