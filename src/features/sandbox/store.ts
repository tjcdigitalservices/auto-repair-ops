import { createSandboxSeed } from "@/features/sandbox/seed";
import type { SandboxSnapshot } from "@/features/sandbox/types";

const DB_NAME = "ars-sandbox";
const STORE_NAME = "snapshot";
const SNAPSHOT_KEY = "shop";

export type SandboxDriver = {
  read: () => Promise<SandboxSnapshot | null>;
  write: (snapshot: SandboxSnapshot) => Promise<void>;
};

export function createMemoryDriver(initial: SandboxSnapshot | null = null): SandboxDriver {
  let value = initial ? structuredClone(initial) : null;

  return {
    async read() {
      return value ? structuredClone(value) : null;
    },
    async write(snapshot) {
      value = structuredClone(snapshot);
    },
  };
}

export function createIndexedDbDriver(): SandboxDriver {
  return {
    async read() {
      const database = await openDatabase();
      try {
        return await new Promise<SandboxSnapshot | null>((resolve, reject) => {
          const transaction = database.transaction(STORE_NAME, "readonly");
          const request = transaction.objectStore(STORE_NAME).get(SNAPSHOT_KEY);
          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? (result as SandboxSnapshot) : null);
          };
          request.onerror = () => reject(request.error ?? new Error("Could not read the sandbox shop."));
        });
      } finally {
        database.close();
      }
    },
    async write(snapshot) {
      const database = await openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction(STORE_NAME, "readwrite");
          const request = transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the sandbox shop."));
          request.onerror = () => reject(request.error ?? new Error("Could not save the sandbox shop."));
        });
      } finally {
        database.close();
      }
    },
  };
}

export type SandboxController = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => SandboxSnapshot | null;
  load: () => Promise<SandboxSnapshot>;
  reset: () => Promise<SandboxSnapshot>;
  update: (recipe: (current: SandboxSnapshot) => SandboxSnapshot) => Promise<SandboxSnapshot>;
};

export function createSandboxController(driver: SandboxDriver): SandboxController {
  let snapshot: SandboxSnapshot | null = null;
  let loadPromise: Promise<SandboxSnapshot> | null = null;
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    load() {
      if (snapshot) {
        return Promise.resolve(snapshot);
      }

      if (!loadPromise) {
        loadPromise = driver
          .read()
          .then(async (stored) => {
            snapshot = stored ?? createSandboxSeed();
            if (!stored) {
              await driver.write(snapshot);
            }
            emit();
            return snapshot;
          })
          .catch((error: unknown) => {
            loadPromise = null;
            throw error;
          });
      }

      return loadPromise;
    },
    async reset() {
      snapshot = createSandboxSeed();
      await driver.write(snapshot);
      emit();
      return snapshot;
    },
    async update(recipe) {
      if (!snapshot) {
        throw new Error("Sandbox is not loaded.");
      }

      snapshot = recipe(snapshot);
      await driver.write(snapshot);
      emit();
      return snapshot;
    },
  };
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    const timer = setTimeout(() => reject(new Error("Sandbox storage did not respond.")), 4000);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      resolve(request.result);
    };
    request.onblocked = () => {
      clearTimeout(timer);
      reject(new Error("Sandbox storage is blocked in this browser."));
    };
    request.onerror = () => {
      clearTimeout(timer);
      reject(request.error ?? new Error("Could not open sandbox storage."));
    };
  });
}

const browserController = createSandboxController(createIndexedDbDriver());

export function getSandboxController() {
  return browserController;
}

export async function loadSandboxShop() {
  return browserController.load();
}

export async function resetSandboxShop() {
  return browserController.reset();
}

export async function updateSandboxShop(recipe: (current: SandboxSnapshot) => SandboxSnapshot) {
  return browserController.update(recipe);
}

export function subscribeSandboxShop(listener: () => void) {
  return browserController.subscribe(listener);
}

export function readSandboxShop() {
  return browserController.getSnapshot();
}
