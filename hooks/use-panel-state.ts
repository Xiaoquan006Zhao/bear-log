"use client"

import { useState, useCallback, useEffect } from "react"
import storage from "@/lib/local-storage"

export function usePanelState() {
  // Panel collapse states
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [middlePanelCollapsed, setMiddlePanelCollapsed] = useState(false)

  // Store panel sizes with localStorage persistence
  const [leftPanelSize, setLeftPanelSize] = useState(18)
  const [middlePanelSize, setMiddlePanelSize] = useState(18)

  // Save panel sizes to localStorage when they change
  useEffect(() => {
    storage.set("leftPanelSize", leftPanelSize)
  }, [leftPanelSize])

  useEffect(() => {
    storage.set("middlePanelSize", middlePanelSize)
  }, [middlePanelSize])

  // Add a useEffect to force panel layout update when collapsed state changes
  useEffect(() => {
    // Small timeout to ensure the DOM has updated before we attempt to resize
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 50)

    return () => clearTimeout(timer)
  }, [leftPanelCollapsed, middlePanelCollapsed])

  // Handle panel toggle functions
  const toggleLeftPanel = useCallback(() => {
    if (leftPanelCollapsed) {
      // When expanding, first restore the panel size
      setLeftPanelSize(storage.get("leftPanelSize", 18))
      // Then uncollapse after a brief delay to allow size restoration
      setTimeout(() => {
        setLeftPanelCollapsed(false)
        if (middlePanelCollapsed) {
          setMiddlePanelSize(storage.get("middlePanelSize", 18))
          setMiddlePanelCollapsed(false)
        }
        // Force layout update
        window.dispatchEvent(new Event("resize"))
      }, 0)
    } else {
      // Store current size before collapsing
      storage.set("leftPanelSize", leftPanelSize)
      setLeftPanelCollapsed(true)
    }
  }, [leftPanelCollapsed, middlePanelCollapsed, leftPanelSize])

  // Update middle panel collapse to also collapse left panel when needed
  const toggleMiddlePanel = useCallback(() => {
    if (middlePanelCollapsed) {
      // When expanding, first restore the panel size
      setMiddlePanelSize(storage.get("middlePanelSize", 18))
      // Then uncollapse after a brief delay to allow size restoration
      setTimeout(() => {
        setMiddlePanelCollapsed(false)
        // No longer expand the left panel when expanding the middle panel
        // Force layout update
        window.dispatchEvent(new Event("resize"))
      }, 0)
    } else {
      // Store current sizes before collapsing
      storage.set("middlePanelSize", middlePanelSize)
      setMiddlePanelCollapsed(true)
      // Keep the double-collapse behavior
      setLeftPanelCollapsed(true)
    }
  }, [middlePanelCollapsed, middlePanelSize])

  // Handle panel resizing
  const handlePanelResize = useCallback(
    (sizes: number[]) => {
      if (sizes.length >= 2) {
        // Only save sizes when panels are expanded
        if (!leftPanelCollapsed) {
          const newLeftSize = sizes[0]
          if (newLeftSize >= 18) {
            setLeftPanelSize(newLeftSize)
            storage.set("leftPanelSize", newLeftSize)
          }
        }

        if (!middlePanelCollapsed) {
          const newMiddleSize = sizes[leftPanelCollapsed ? 0 : 1]
          if (newMiddleSize >= 18) {
            setMiddlePanelSize(newMiddleSize)
            storage.set("middlePanelSize", newMiddleSize)
          }
        }
      }
    },
    [leftPanelCollapsed, middlePanelCollapsed],
  )

  // Calculate panel sizes based on collapsed state with improved transition handling
  const getLeftPanelSize = useCallback(() => {
    return leftPanelCollapsed ? 3 : Math.max(leftPanelSize, 18)
  }, [leftPanelCollapsed, leftPanelSize])

  const getMiddlePanelSize = useCallback(() => {
    return middlePanelCollapsed ? 3 : Math.max(middlePanelSize, 18)
  }, [middlePanelCollapsed, middlePanelSize])

  const getRightPanelSize = useCallback(() => {
    // Calculate the remaining space for the right panel
    const leftSize = getLeftPanelSize()
    const middleSize = getMiddlePanelSize()
    const rightSize = 100 - leftSize - middleSize

    // Ensure right panel is at least 64% when both other panels are expanded
    if (!leftPanelCollapsed && !middlePanelCollapsed && rightSize < 64) {
      // If right panel would be less than 64%, adjust the other panels proportionally
      const totalOtherPanels = leftSize + middleSize
      const ratio = 36 / totalOtherPanels // 36% is what's left for other panels

      // Adjust sizes proportionally
      const adjustedLeftSize = leftSize * ratio
      const adjustedMiddleSize = middleSize * ratio

      return 64
    }

    return rightSize
  }, [getLeftPanelSize, getMiddlePanelSize])

  useEffect(() => {
    // Load saved panel sizes from localStorage after component mounts
    const savedLeftSize = storage.get("leftPanelSize", 18)
    const savedMiddleSize = storage.get("middlePanelSize", 18)

    if (typeof savedLeftSize === "number" && savedLeftSize >= 18) {
      setLeftPanelSize(savedLeftSize)
    }

    if (typeof savedMiddleSize === "number" && savedMiddleSize >= 18) {
      setMiddlePanelSize(savedMiddleSize)
    }
  }, [])

  return {
    leftPanelCollapsed,
    middlePanelCollapsed,
    leftPanelSize,
    middlePanelSize,
    toggleLeftPanel,
    toggleMiddlePanel,
    handlePanelResize,
    getLeftPanelSize,
    getMiddlePanelSize,
    getRightPanelSize,
    setLeftPanelCollapsed,
    setMiddlePanelCollapsed,
  }
}

