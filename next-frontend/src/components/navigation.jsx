"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Map, Laptop, Layout, FileText, Users, Settings } from "lucide-react"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Navigation() {
  const [mebers, setMebers] = useState([])
  const [currentMeber, setCurrentMeber] = useState(null)

  useEffect(() => {
    // Fetch mebers from the backend
    const fetchMebers = async () => {
      try {
        const response = await fetch(`${backendUrl}/mebers`) // Fetch mebers from backend
        if (!response.ok) {
          throw new Error('Failed to fetch mebers')
        }
        const data = await response.json()
        setMebers(data)
      } catch (error) {
        console.error('Error fetching mebers:', error)
      }
    }

    fetchMebers()

    // Load the current meber from localStorage if available
    const storedMeberId = localStorage.getItem('meber_id')
    const storedMeberName = localStorage.getItem('meber_name')
    if (storedMeberId && storedMeberName) {
      setCurrentMeber({
        id: parseInt(storedMeberId),
        name: storedMeberName,
      })
    }
  }, [])

  const handleRoleChange = async (meberId) => {
    const selectedMeber = mebers.find(meber => meber.id === meberId)
    if (selectedMeber) {
      setCurrentMeber(selectedMeber)
      try {
        // Send login request to backend to get JWT
        const response = await fetch(`${backendUrl}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ meber_id: meberId }),
        })

        if (!response.ok) {
          throw new Error('Failed to login')
        }

        const data = await response.json()
        // Store the JWT token and selected meber info in local storage
        localStorage.setItem('token', data.token)
        localStorage.setItem('meber_id', selectedMeber.id)
        localStorage.setItem('meber_name', selectedMeber.name)
        console.log('Logged in successfully. Token:', data.token)

        // Reload the page to force correct authentication
        window.location.reload()
      } catch (error) {
        console.error('Error logging in:', error)
      }
    }
  }

  return (
      <nav className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center space-x-4">
          <Link href="/" passHref legacyBehavior>
            <Button variant="ghost" className="flex items-center" as="a">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/map" passHref legacyBehavior>
            <Button variant="ghost" className="flex items-center" as="a">
              <Map className="mr-2 h-4 w-4" />
              Map
            </Button>
          </Link>
          <Link href="/device" passHref legacyBehavior>
            <Button variant="ghost" className="flex items-center" as="a">
              <Laptop className="mr-2 h-4 w-4" />
              Devices
            </Button>
          </Link>
          <Link href="/appstore" passHref legacyBehavior>
            <Button variant="ghost" className="flex items-center" as="a">
              <Settings className="mr-2 h-4 w-4" />
              App store
            </Button>
          </Link>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{currentMeber ? currentMeber.name[0] : 'M'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Demo Mode</p>
                  <p className="text-xs leading-none text-muted-foreground">Switch mebers</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mebers.map((meber) => (
                  <DropdownMenuItem key={meber.id} onSelect={() => handleRoleChange(meber.id)}>
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarFallback>{meber.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span>{meber.name}</span>
                      {meber.Roles && (
                          <div className="text-xs text-muted-foreground">
                            {meber.Roles.map(role => role.name).join(', ')}
                          </div>
                      )}
                    </div>
                    {currentMeber && currentMeber.id === meber.id && (
                        <span className="ml-auto font-semibold">✓</span>
                    )}
                  </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
  )
}
