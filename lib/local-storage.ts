// Add better error handling and type safety for storage operations
type StorageValue = string | number | boolean | object | null

const storage = {
  get<T extends StorageValue>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") {
      return defaultValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return defaultValue
      }

      const parsed = JSON.parse(item)
      return parsed === 0 ? 0 : parsed || defaultValue
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  },

  set(key: string, value: StorageValue): void {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  },
}

export default storage

