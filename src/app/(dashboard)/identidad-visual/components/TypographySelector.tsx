"use client";

import { useState, useMemo } from "react";
import { GOOGLE_FONTS, FontCategory } from "@/lib/fonts";
import { Search, Sparkles, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AIFontSuggesterModal } from "./AIFontSuggesterModal";

interface TypographySelectorProps {
    selectedFont: string;
    onSelectFont: (font: string) => void;
}

export function TypographySelector({ selectedFont, onSelectFont }: TypographySelectorProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<FontCategory | "All">("All");
    const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);

    const filteredFonts = useMemo(() => {
        return GOOGLE_FONTS.filter(f => {
            const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
            const matchesCat = activeCategory === "All" || f.category === activeCategory;
            return matchesSearch && matchesCat;
        });
    }, [search, activeCategory]);

    return (
        <div className="flex flex-col gap-4 border border-white/10 p-4 sm:p-6 rounded-xl bg-black/20">
            <AIFontSuggesterModal
                isOpen={isSuggesterOpen}
                onClose={() => setIsSuggesterOpen(false)}
                onSelectFont={onSelectFont}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar tipografía..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border-white/10 pl-9"
                    />
                </div>

                <Button
                    onClick={() => setIsSuggesterOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 whitespace-nowrap"
                >
                    <Sparkles className="w-4 h-4 mr-2" /> Sugerir con IA
                </Button>
            </div>

            <Tabs defaultValue="All" onValueChange={(v) => setActiveCategory(v as any)}>
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <TabsList className="bg-transparent border border-white/10 p-1">
                        <TabsTrigger value="All" className="data-[state=active]:bg-zinc-800">Todas</TabsTrigger>
                        <TabsTrigger value="Sans Serif" className="data-[state=active]:bg-zinc-800">Sans Serif</TabsTrigger>
                        <TabsTrigger value="Serif" className="data-[state=active]:bg-zinc-800">Serif</TabsTrigger>
                        <TabsTrigger value="Display" className="data-[state=active]:bg-zinc-800">Display</TabsTrigger>
                        <TabsTrigger value="Handwriting" className="data-[state=active]:bg-zinc-800">Handwriting</TabsTrigger>
                        <TabsTrigger value="Monospace" className="data-[state=active]:bg-zinc-800">Monospace</TabsTrigger>
                    </TabsList>
                </ScrollArea>
            </Tabs>

            <ScrollArea className="h-[280px] w-full rounded-md border border-white/5 bg-black/40 p-4">
                {filteredFonts.length === 0 ? (
                    <p className="text-center text-zinc-500 py-10">No se encontraron fuentes.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredFonts.map((font) => {
                            const fontUrl = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, '+')}&display=swap`;

                            return (
                                <div
                                    key={font.name}
                                    onClick={() => onSelectFont(font.name)}
                                    className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center group ${selectedFont === font.name
                                        ? "bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500"
                                        : "bg-zinc-900 border-white/5 hover:bg-zinc-800 hover:border-white/20"
                                        }`}
                                    style={{ minHeight: "100px" }}
                                >
                                    {selectedFont === font.name && (
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                    )}
                                    <link href={fontUrl} rel="stylesheet" />
                                    <span
                                        className={`text-2xl mb-2 transition-colors ${selectedFont === font.name ? "text-orange-400" : "text-zinc-300"}`}
                                        style={{ fontFamily: `"${font.name}", sans-serif` }}
                                    >
                                        Ag
                                    </span>
                                    <p className="text-[11px] font-medium text-zinc-400 truncate w-full px-1">{font.name}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
