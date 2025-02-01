import { openDB } from 'idb';

const DB_NAME = 'serien-db';
const STORE_NAME = 'serien-store';
const OFFLINE_STORE_NAME = 'offline-store';
const OFFLINE_RATING_STORE_NAME = 'offline-rating-store';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
      }
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        db.createObjectStore(OFFLINE_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(OFFLINE_RATING_STORE_NAME)) {
        db.createObjectStore(OFFLINE_RATING_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};

export const saveData = async (data) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.put(data);
  await tx.done;
};

export const getData = async (id) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const data = await store.get(id);
  await tx.done;
  return data;
};

export const saveOfflineData = async (data) => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OFFLINE_STORE_NAME);
  await store.put(data);
  await tx.done;
};

export const getOfflineData = async () => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
  const store = tx.objectStore(OFFLINE_STORE_NAME);
  const allData = await store.getAll();
  await tx.done;
  return allData;
};

export const clearOfflineData = async () => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OFFLINE_STORE_NAME);
  await store.clear();
  await tx.done;
};

export const saveOfflineRating = async (ratingData) => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_RATING_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OFFLINE_RATING_STORE_NAME);
  await store.put(ratingData);
  await tx.done;
};

export const getOfflineRatings = async () => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_RATING_STORE_NAME, 'readonly');
  const store = tx.objectStore(OFFLINE_RATING_STORE_NAME);
  const allRatings = await store.getAll();
  await tx.done;
  return allRatings;
};

export const clearOfflineRatings = async () => {
  const db = await initDB();
  const tx = db.transaction(OFFLINE_RATING_STORE_NAME, 'readwrite');
  const store = tx.objectStore(OFFLINE_RATING_STORE_NAME);
  await store.clear();
  await tx.done;
};
