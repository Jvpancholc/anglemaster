"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Image as ImageIcon, PenTool, Box, PlaySquare, Layout, Sparkles, ImagePlus, UploadCloud, User, Target, Save, Eye } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

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
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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



    const handleSave = async () => {
        if (!activeProjectId || !selectedStyle) return;
        setIsSaving(true);
        const toastId = toast.loading("Guardando estilo visual...");

        try {
            updateProject(activeProjectId, {
                visualStyle: selectedStyle,
            });

            toast.success("Estilo visual guardado.", { id: toastId });
            router.push("/similitud-ia");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar estilo visual", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 font-medium mb-4">
                        <Eye className="w-3.5 h-3.5" />
                        Fase 4: Estética Central
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
                        Estilo <span className="text-emerald-400">Visual</span>
                    </h1>
                    <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
                        Selecciona el estilo base preferido sobre el que se basará la generación final de creativos.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const Icon = style.icon;

                    return (
                        <Card
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[160px] flex flex-col border
                                ${isSelected
                                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
                                    : "bg-[#0e0e12] border-white/5 hover:bg-[#111116] hover:border-white/10"
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 z-20">
                                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            )}

                            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full gap-3 relative z-10 w-full">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300
                                    ${isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300"}
                                `}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <div className="w-full">
                                    <h3 className={`font-bold mb-1 text-sm ${isSelected ? "text-indigo-100" : "text-zinc-200"}`}>
                                        {style.title}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 leading-tight">
                                        {style.desc}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>



            <div className="sticky bottom-6 mt-4 p-4 rounded-2xl bg-[#111116] border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl z-10 w-full">
                <div className="text-sm text-zinc-400 flex items-center gap-2 px-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Completa tu entrenamiento IA para mejores resultados.
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!selectedStyle || isSaving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    {isSaving ? "Guardando y Subiendo..." : "Guardar Referencias y Continuar"}
                </Button>
            </div>
        </div >
    );
}
