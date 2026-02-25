"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Image as ImageIcon, PenTool, Box, PlaySquare, Layout } from "lucide-react";

const STYLE_OPTIONS = [
    {
        id: "ultrarrealista",
        title: "Ultrarrealista",
        desc: "Fotografía de alta definición, texturas reales, iluminación de estudio.",
        icon: ImageIcon
    },
    {
        id: "ilustrado",
        title: "Ilustrado",
        desc: "Arte digital vectorial, vibrante y estilizado.",
        icon: PenTool
    },
    {
        id: "3d-render",
        title: "3D Render",
        desc: "Modelo 3D moderno, materiales brillantes, estilo Pixar/Blender.",
        icon: Box
    },
    {
        id: "animado",
        title: "Animado",
        desc: "Estilo cartoon moderno o anime de alta calidad.",
        icon: PlaySquare
    },
    {
        id: "minimalista",
        title: "Minimalista",
        desc: "Diseño limpio, mucho espacio negativo, elegante.",
        icon: Layout
    }
];

export default function EstiloVisualPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project && project.visualStyle) {
            setSelectedStyle(project.visualStyle);
        }
    }, [activeProjectId, projects, router]);

    const handleSave = () => {
        if (!activeProjectId || !selectedStyle) return;

        updateProject(activeProjectId, {
            visualStyle: selectedStyle
        });

        toast.success("Estilo visual guardado.");
        router.push("/analisis-ia");
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-400 font-medium mb-4">
                    <PenTool className="w-3 h-3" />
                    Estética Fundamental
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Estilo <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-pink-500">Visual</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Define la técnica artística base. Selecciona una opción para guiar al modelo.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const Icon = style.icon;

                    return (
                        <Card
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[220px] flex flex-col
                                ${isSelected
                                    ? "bg-fuchsia-500/5 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.15)] ring-1 ring-fuchsia-500/30 scale-[1.02]"
                                    : "bg-zinc-950/60 border-white/5 hover:bg-zinc-900/80 hover:border-white/20"
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 z-20">
                                    <div className="w-5 h-5 bg-fuchsia-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            )}

                            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300
                                    ${isSelected ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300"}
                                `}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div>
                                    <h3 className={`font-bold mb-1 ${isSelected ? "text-fuchsia-100" : "text-zinc-200"}`}>
                                        {style.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {style.desc}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
                <p className="text-sm text-zinc-400 flex items-center gap-2">
                    <span className="text-fuchsia-500 text-lg">🎨</span> El estilo seleccionado se combinará con los <strong className="text-emerald-400">Formatos Creativos</strong>.
                </p>
                <Button
                    onClick={handleSave}
                    disabled={!selectedStyle}
                    className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente: Análisis IA <span className="ml-2 font-serif text-xl leading-none">→</span>
                </Button>
            </div>
        </div>
    );
}
