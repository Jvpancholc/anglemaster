"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { GOOGLE_FONTS } from "@/lib/fonts";

interface AIFontSuggesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFont: (fontName: string) => void;
}

export function AIFontSuggesterModal({ isOpen, onClose, onSelectFont }: AIFontSuggesterModalProps) {
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<typeof GOOGLE_FONTS>([]);

    const handleGenerate = async () => {
        if (!description.trim()) {
            toast.error("Por favor, describe tu marca");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/detect-font", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description })
            });

            if (!res.ok) throw new Error("Error en la recomendación");
            const data = await res.json();

            // Filter the local GOOGLE_FONTS to only include the names suggested
            const suggestedNames: string[] = data.fonts || [];
            const foundFonts = GOOGLE_FONTS.filter(f => suggestedNames.includes(f.name));

            if (foundFonts.length === 0) {
                // Fallback just in case
                setResults(GOOGLE_FONTS.slice(0, 3));
            } else {
                setResults(foundFonts);
            }

            toast.success("Tipografías recomendadas");
        } catch (e: any) {
            toast.error(e.message || "Error al conectar con la IA");
            // Fallback
            setTimeout(() => {
                setResults([GOOGLE_FONTS[0], GOOGLE_FONTS[1], GOOGLE_FONTS[2]]);
            }, 1000);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = (fontName: string) => {
        onSelectFont(fontName);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-white/10 bg-zinc-950 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-5 h-5 text-orange-400" /> Asistente de Tipografía IA
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Describe el estilo de tu marca y la IA buscará las mejores tipografías para ti.
                    </DialogDescription>
                </DialogHeader>

                {results.length === 0 ? (
                    <div className="space-y-4 my-4">
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black/50 border-white/10 resize-none h-32 text-base p-4"
                            placeholder="Ej. Mi marca es una startup financiera moderna, minimalista pero que transmite mucha confianza y seguridad..."
                        />
                    </div>
                ) : (
                    <div className="space-y-4 my-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm font-medium text-zinc-300">Sugerencias basadas en tu descripción:</p>
                        <div className="grid gap-3">
                            {results.map((font) => (
                                <div
                                    key={font.name}
                                    onClick={() => handleSelect(font.name)}
                                    className="p-4 bg-zinc-900 rounded-xl border border-white/5 hover:border-orange-500 hover:bg-orange-500/5 cursor-pointer transition flex items-center justify-between group"
                                >
                                    <div>
                                        <h4 className="font-semibold text-white truncate" style={{ fontFamily: `"${font.name}", sans-serif` }}>{font.name}</h4>
                                        <p className="text-xs text-zinc-500">{font.category} • Se adapta a tu estilo</p>
                                    </div>
                                    <div className="hidden group-hover:flex items-center text-orange-400 text-sm font-medium">
                                        Aplicar
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-2">
                            <Button variant="ghost" onClick={() => setResults([])} className="text-zinc-500 hover:text-white text-xs">
                                ← Buscar diferente
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-end gap-2 border-t border-white/5 pt-4">
                    {results.length === 0 && (
                        <>
                            <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !description.trim()}
                                className="bg-orange-600 hover:bg-orange-500 text-white border-0"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Buscar Fuentes</span>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
