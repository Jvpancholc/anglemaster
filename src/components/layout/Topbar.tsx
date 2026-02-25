"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export const Topbar = () => {
    return (
        <div className="flex items-center p-4 bg-white/10 backdrop-blur-md border-b border-border shadow-sm">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-[#111827] border-0 text-white w-72">
                        <VisuallyHidden.Root>
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>Access different sections of AngleMaster</SheetDescription>
                        </VisuallyHidden.Root>
                        <Sidebar />
                    </SheetContent>
                </Sheet>
            </div>
            <div className="flex w-full justify-end">
                {/* Usaremos Clerk Component o un Avatar nativo más adelante */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium text-sm">
                    U
                </div>
            </div>
        </div>
    );
};
