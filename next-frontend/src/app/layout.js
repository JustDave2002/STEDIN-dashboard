import Link from 'next/link'
import localFont from "next/font/local";
import "./globals.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Map, Laptop, Layout, FileText, Users, Settings, User } from "lucide-react"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
                  <AvatarImage src="/placeholder-avatar.jpg" alt="@username" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">username</p>
                  <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      {children}
      </body>
    </html>
  );
}
