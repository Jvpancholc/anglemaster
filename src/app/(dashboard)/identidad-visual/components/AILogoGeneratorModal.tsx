"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store";

interface AILogoGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectLogo: (url: string) => void;
}

export function AILogoGeneratorModal({ isOpen, onClose, onSelectLogo }: AILogoGeneratorModalProps) {
    const { activeProjectId, projects } = useProjectStore();
    const project = projects.find(p => p.id === activeProjectId);

    const [brandName, setBrandName] = useState(project?.config?.businessName || "");
    const [industry, setIndustry] = useState(project?.config?.niche || "");
    const [style, setStyle] = useState("Minimalista");
    const [description, setDescription] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const handleGenerate = async () => {
        if (!brandName) {
            toast.error("El nombre de la marca es obligatorio");
            return;
        }

        setIsGenerating(true);
        try {
            const res = await fetch("/api/generate-logo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandName,
                    industry,
                    style,
                    description,
                })
            });

            if (!res.ok) throw new Error("Error generando el logo");
            const data = await res.json();
            setResults(data.urls || []);
            toast.success("¡Logos generados exitosamente!");
        } catch (e: any) {
            toast.error(e.message || "Error al conectar con la IA perturbadora");

            // MOCK DATA for local testing / demo fallback
            setTimeout(() => {
                setResults([
                    "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=400&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1516876437184-593fda40c7ce?q=80&w=400&auto=format&fit=crop",
                ]);
            }, 1500);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = (url: string) => {
        onSelectLogo(url);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] border-white/10 bg-zinc-950 text-white shadow-2xl h-[90vh] sm:h-auto overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="w-6 h-6 text-fuchsia-400" /> Creador de Logos IA
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-base">
                        Describe tu marca y nuestra inteligencia artificial generará opciones de logo únicas en segundos.
                    </DialogDescription>
                </DialogHeader>

                {results.length === 0 ? (
                    <div className="space-y-6 my-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Nombre de la Marca *</label>
                                <Input
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="bg-black/50 border-white/10"
                                    placeholder="Ej: Inmoballadares"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Industria / Nicho</label>
                                <Input
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="bg-black/50 border-white/10"
                                    placeholder="Ej: Bienes Raíces, Tecnología"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Estilo Visual</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                {['Minimalista', 'Moderno', 'Clásico', 'Lujoso', 'Divertido'].map(s => (
                                    <div
                                        key={s}
                                        onClick={() => setStyle(s)}
                                        className={`text-center py-2 px-1 rounded-md text-xs cursor-pointer transition ${style === s ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50' : 'bg-black/50 border border-white/5 text-zinc-400 hover:bg-white/5'}`}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Descripción adicional (Opcional)</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-black/50 border-white/10 resize-none h-24"
                                placeholder="Ej: Quiero que incluya un ícono de una casa sutil, colores cálidos que transmitan confianza..."
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 my-4">
                        <p className="text-zinc-300">Selecciona el logo que más te guste para tu proyecto:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {results.map((url, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(url)}
                                    className="aspect-square bg-zinc-900 rounded-xl overflow-hidden border-2 border-transparent hover:border-fuchsia-500 cursor-pointer transition group"
                                >
                                    <img src={url} alt={`Generado ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={() => setResults([])} className="border-white/10 text-zinc-400 hover:text-white">
                                ← Generar de nuevo
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
                                disabled={isGenerating || !brandName}
                                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white border-0"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creando magia...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> Generar Logos</span>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
