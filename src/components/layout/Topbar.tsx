"use client";

import { Menu, ChevronLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export const Topbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { activeProjectId } = useProjectStore();
    const isDashboard = pathname === "/";

    return (
        <div className="flex items-center p-4 bg-zinc-950/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50 justify-between">
            <div className="flex items-center gap-2">
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/5">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 bg-zinc-950/95 backdrop-blur-2xl border-r border-border/40 text-foreground w-72">
                            <VisuallyHidden.Root>
                                <SheetTitle>Navigation Menu</SheetTitle>
                                <SheetDescription>Access different sections of AngleMaster</SheetDescription>
                            </VisuallyHidden.Root>
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                </div>

                {!isDashboard && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 hidden sm:flex"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                {activeProjectId && (
                    <div className="hidden md:flex text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="opacity-70 mr-1">Proyecto:</span> {activeProjectId.slice(0, 8)}...
                    </div>
                )}
                {/* Usaremos Clerk Component o un Avatar nativo más adelante */}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-medium text-sm shadow-[0_0_15px_rgba(124,58,237,0.4)] ring-2 ring-primary/20">
                    U
                </div>
            </div>
        </div>
    );
};
