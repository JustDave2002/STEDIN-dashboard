'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import AppList from './app-list'
import AppDetail from './app-detail'
import InstallApplication from './install-application'

export default function AppStore() {
    const [apps, setApps] = useState([])
    const [selectedApp, setSelectedApp] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [isInstalling, setIsInstalling] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const response = await fetch('http://localhost:8000/appstore')
                if (!response.ok) {
                    throw new Error('Failed to fetch apps')
                }
                const data = await response.json()
                setApps(data)
            } catch (error) {
                console.error('Error fetching apps:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchApps()
    }, [])

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a[sortBy].localeCompare(b[sortBy]))

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <div className="mb-4 space-y-2">
                    <Input
                        type="text"
                        placeholder="Search applications"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="id">ID</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : (
                    <AppList apps={filteredApps} onSelectApp={setSelectedApp} />
                )}
            </div>
            <div className="md:col-span-2">
                {selectedApp ? (
                    <AppDetail
                        app={selectedApp}
                        onInstall={() => setIsInstalling(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Select an application to view details</p>
                    </div>
                )}
            </div>
            {isInstalling && selectedApp && (
                <InstallApplication
                    app={selectedApp}
                    onClose={() => setIsInstalling(false)}
                />
            )}
        </div>
    )
}

