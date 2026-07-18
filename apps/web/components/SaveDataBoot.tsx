'use client'

import { useEffect } from 'react'

type NetworkInformation = EventTarget & {
  saveData?: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation
}

export function SaveDataBoot() {
  useEffect(() => {
    const connection = (navigator as NavigatorWithConnection).connection
    if (!connection) return

    const syncPreference = () => {
      if (connection.saveData) {
        document.documentElement.dataset.saveData = '1'
      } else {
        delete document.documentElement.dataset.saveData
      }
    }

    syncPreference()
    connection.addEventListener('change', syncPreference)
    return () => connection.removeEventListener('change', syncPreference)
  }, [])

  return null
}
