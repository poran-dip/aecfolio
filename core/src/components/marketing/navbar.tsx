"use client";

import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

function ListItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block px-3 py-2 text-sm rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {children}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function MarketingNavbar() {
  return (
    <header className="fixed top-0 w-full z-30 flex items-center justify-between px-6 h-16 bg-background/80 backdrop-blur-sm border-b border-border">

      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="AEC logo" width={32} height={32} />
        <span className="text-sm font-medium text-foreground">AECFolio</span>
      </Link>

      <div className="flex items-center gap-2">
        <NavigationMenu>
          <NavigationMenuList>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm text-muted-foreground">
                Talent
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex flex-col w-48 p-1.5">
                  <ListItem href="/talent/internship">Open to internship</ListItem>
                  <ListItem href="/talent/hire">Open to work</ListItem>
                  <li className="h-px bg-border my-1" />
                  <ListItem href="/talent">View all</ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/about" className="text-sm text-muted-foreground">
                  About
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>

        <div className="w-px h-5 bg-border mx-1.5" />

        <Button asChild size="sm">
          <Link href="/dashboard">Sign in</Link>
        </Button>
      </div>

    </header>
  );
}
