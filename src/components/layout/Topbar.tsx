"use client";

import { Menu, ChevronLeft, Globe } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

export const Topbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { activeProjectId, updateSettings } = useProjectStore();
    const isDashboard = pathname === "/dashboard";
    const [uiLang, setUiLang] = useState("ES");
    const { t } = useTranslation();

    useEffect(() => {
        const savedLang = localStorage.getItem("global_ui_lang");
        if (savedLang) setUiLang(savedLang);
    }, []);

    const handleLangChange = (lang: string) => {
        setUiLang(lang);
        updateSettings({ language: lang });
        localStorage.setItem("global_ui_lang", lang);
    };

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
                        <ChevronLeft className="w-4 h-4 mr-1" /> {t.topbar.volver}
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                {activeProjectId && (
                    <div className="hidden md:flex text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="opacity-70 mr-1">{t.topbar.proyecto}</span> {activeProjectId.slice(0, 8)}...
                    </div>
                )}

                {/* Language Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full">
                            <Globe className="w-4 h-4" />
                            <span className="sr-only">{t.topbar.cambiarIdioma}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10">
                        <DropdownMenuItem onClick={() => handleLangChange("ES")} className="cursor-pointer flex items-center gap-2">
                            <span>🇪🇸</span> {t.topbar.es} {uiLang === "ES" && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLangChange("EN")} className="cursor-pointer flex items-center gap-2">
                            <span>🇺🇸</span> {t.topbar.en} {uiLang === "EN" && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLangChange("PT")} className="cursor-pointer flex items-center gap-2">
                            <span>🇧🇷</span> {t.topbar.pt} {uiLang === "PT" && "✓"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Avatar and Account Management via Clerk */}
                <UserButton afterSignOutUrl="/" />
            </div>
        </div>
    );
};
