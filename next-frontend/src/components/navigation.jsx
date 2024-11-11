"use client"

import { useState } from 'react'
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

const roles = [
  { id: 'admin', name: 'Admin', avatar: 'A' },
  { id: 'manager', name: 'Manager', avatar: 'M' },
  { id: 'user', name: 'User', avatar: 'U' },
]

export default function Navigation() {
  const [currentRole, setCurrentRole] = useState(roles[0])

  const handleRoleChange = (roleId) => {
    const newRole = roles.find(role => role.id === roleId)
    if (newRole) {
      setCurrentRole(newRole)
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
        <Link href="/applications" passHref legacyBehavior>
          <Button variant="ghost" className="flex items-center" as="a">
            <Layout className="mr-2 h-4 w-4" />
            Applications
          </Button>
        </Link>
        <Link href="/logs" passHref legacyBehavior>
          <Button variant="ghost" className="flex items-center" as="a">
            <FileText className="mr-2 h-4 w-4" />
            Logs
          </Button>
        </Link>
        <Link href="/users" passHref legacyBehavior>
          <Button variant="ghost" className="flex items-center" as="a">
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
        </Link>
        <Link href="/settings" passHref legacyBehavior>
          <Button variant="ghost" className="flex items-center" as="a">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentRole.avatar}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Demo Mode</p>
                <p className="text-xs leading-none text-muted-foreground">Switch roles</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((role) => (
              <DropdownMenuItem key={role.id} onSelect={() => handleRoleChange(role.id)}>
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarFallback>{role.avatar}</AvatarFallback>
                </Avatar>
                <span>{role.name}</span>
                {currentRole.id === role.id && (
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