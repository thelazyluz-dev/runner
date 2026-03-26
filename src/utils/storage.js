/**
 * AsyncStorage with an in-memory fallback.
 * Install @react-native-async-storage/async-storage for real persistence;
 * until then data survives the session but not app restarts.
 */
let AsyncStorage;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  const _mem = {};
  AsyncStorage = {
    getItem: async (key) => _mem[key] ?? null,
    setItem: async (key, value) => { _mem[key] = value; },
    removeItem: async (key) => { delete _mem[key]; },
  };
}

export default AsyncStorage;
