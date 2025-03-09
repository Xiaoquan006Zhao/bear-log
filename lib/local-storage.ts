// Add better error handling and type safety for storage operations
const storage = {
  get(key: string, defaultValue: any): any {
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

  set(key: string, value: any): void {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  },

  clear(): void {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.clear()
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  },
}

export default storage

