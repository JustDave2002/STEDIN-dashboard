"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LocalStorageDebugger() {
  const [localStorageContent, setLocalStorageContent] = useState({})

  useEffect(() => {
    updateLocalStorageContent()
  }, [])

  const updateLocalStorageContent = () => {
    const content = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        content[key] = localStorage.getItem(key) || ''
      }
    }
    setLocalStorageContent(content)
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    updateLocalStorageContent()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>localStorage Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={updateLocalStorageContent}>Refresh localStorage Content</Button>
          <Button variant="destructive" onClick={clearLocalStorage}>Clear localStorage</Button>
          <div className="bg-muted p-4 rounded-md">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(localStorageContent, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}