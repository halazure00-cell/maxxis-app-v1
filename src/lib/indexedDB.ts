// IndexedDB Wrapper untuk Offline Hotspot Storage
// Menyimpan dan mengambil data hotspot secara offline

const DB_NAME = "maxim-driver-db";
const DB_VERSION = 1;
const HOTSPOT_STORE = "hotspots";
const META_STORE = "metadata";

interface HotspotRecord {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: string;
  peak_hours: string[] | null;
  is_safe_zone: boolean;
  is_preset: boolean;
  verified: boolean;
  upvotes: number;
  tips?: string;
  area?: string;
  synced_at: number;
}

interface MetadataRecord {
  key: string;
  value: string | number | boolean;
  updated_at: number;
}

// Open or create the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create hotspots store
      if (!db.objectStoreNames.contains(HOTSPOT_STORE)) {
        const hotspotStore = db.createObjectStore(HOTSPOT_STORE, { keyPath: "id" });
        hotspotStore.createIndex("category", "category", { unique: false });
        hotspotStore.createIndex("area", "area", { unique: false });
        hotspotStore.createIndex("is_preset", "is_preset", { unique: false });
        hotspotStore.createIndex("synced_at", "synced_at", { unique: false });
      }

      // Create metadata store
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
  });
};

// Save hotspots to IndexedDB
export const saveHotspots = async (hotspots: HotspotRecord[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(HOTSPOT_STORE, "readwrite");
  const store = transaction.objectStore(HOTSPOT_STORE);

  const now = Date.now();

  return new Promise((resolve, reject) => {
    hotspots.forEach((hotspot) => {
      store.put({ ...hotspot, synced_at: now });
    });

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

// Get all hotspots from IndexedDB
export const getAllHotspots = async (): Promise<HotspotRecord[]> => {
  const db = await openDB();
  const transaction = db.transaction(HOTSPOT_STORE, "readonly");
  const store = transaction.objectStore(HOTSPOT_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Get hotspots by category
export const getHotspotsByCategory = async (category: string): Promise<HotspotRecord[]> => {
  const db = await openDB();
  const transaction = db.transaction(HOTSPOT_STORE, "readonly");
  const store = transaction.objectStore(HOTSPOT_STORE);
  const index = store.index("category");

  return new Promise((resolve, reject) => {
    const request = index.getAll(category);

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Get hotspots by area
export const getHotspotsByArea = async (area: string): Promise<HotspotRecord[]> => {
  const db = await openDB();
  const transaction = db.transaction(HOTSPOT_STORE, "readonly");
  const store = transaction.objectStore(HOTSPOT_STORE);
  const index = store.index("area");

  return new Promise((resolve, reject) => {
    const request = index.getAll(area);

    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Clear all hotspots (for resync)
export const clearHotspots = async (): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(HOTSPOT_STORE, "readwrite");
  const store = transaction.objectStore(HOTSPOT_STORE);

  return new Promise((resolve, reject) => {
    const request = store.clear();

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Save metadata
export const saveMetadata = async (key: string, value: string | number | boolean): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(META_STORE, "readwrite");
  const store = transaction.objectStore(META_STORE);

  return new Promise((resolve, reject) => {
    const record: MetadataRecord = {
      key,
      value,
      updated_at: Date.now(),
    };

    const request = store.put(record);

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Get metadata
export const getMetadata = async (key: string): Promise<MetadataRecord | null> => {
  const db = await openDB();
  const transaction = db.transaction(META_STORE, "readonly");
  const store = transaction.objectStore(META_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get(key);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

// Get last sync time
export const getLastSyncTime = async (): Promise<number | null> => {
  const metadata = await getMetadata("last_sync");
  return metadata ? (metadata.value as number) : null;
};

// Set last sync time
export const setLastSyncTime = async (): Promise<void> => {
  await saveMetadata("last_sync", Date.now());
};

// Check if database has any hotspots
export const hasOfflineData = async (): Promise<boolean> => {
  try {
    const hotspots = await getAllHotspots();
    return hotspots.length > 0;
  } catch {
    return false;
  }
};

// Get hotspot count
export const getHotspotCount = async (): Promise<number> => {
  try {
    const hotspots = await getAllHotspots();
    return hotspots.length;
  } catch {
    return 0;
  }
};

// Export type for use in hooks
export type { HotspotRecord, MetadataRecord };
