"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

const FORMAT_OPTIONS = [
    {
        id: "noticiero",
        title: "Noticiero",
        desc: "Autoridad inmediata. Presentador de noticias.",
        color: "emerald"
    },
    {
        id: "infografia-cta",
        title: "Infografía con Texto + CTA",
        desc: "Educativo con llamada a la acción clara.",
        color: "emerald"
    },
    {
        id: "infografia-hook",
        title: "Infografía solo con 'Hook'",
        desc: "Gancho visual viral con título gigante.",
        color: "emerald"
    },
    {
        id: "antes-despues",
        title: "Antes y Después",
        desc: "Comparativa impactante de transformación.",
        color: "emerald"
    }
];

export default function FormatoCreativoPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project && project.creativeFormats) {
            setSelectedFormats(project.creativeFormats);
        }
    }, [activeProjectId, projects, router]);

    const toggleFormat = (id: string) => {
        setSelectedFormats(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        if (!activeProjectId) return;

        updateProject(activeProjectId, {
            creativeFormats: selectedFormats
        });

        toast.success("Formatos guardados con éxito.");
        router.push("/estilo-visual");
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configuración de Formato
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Formato Creativo</h1>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Activa o desactiva los estilos visuales que la IA utilizará durante la generación.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {FORMAT_OPTIONS.map((format) => {
                    const isSelected = selectedFormats.includes(format.id);

                    return (
                        <Card
                            key={format.id}
                            onClick={() => toggleFormat(format.id)}
                            className={`relative overflow-hidden group cursor-pointer transition-all duration-300 min-h-[400px] flex flex-col justify-end
                                ${isSelected
                                    ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 scale-[1.02]"
                                    : "border-white/10 bg-zinc-950/60 hover:border-white/30"
                                }
                            `}
                        >
                            {/* Fake background image layer matching the vibe of the mockups */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-800/20 z-0" />
                            <div className={`absolute inset-0 bg-emerald-500/5 transition-opacity duration-300 ${isSelected ? "opacity-100" : "opacity-0"}`} />

                            {/* Active Badge */}
                            <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                                <div className="px-3 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-lg">
                                    <CheckCircle2 className="w-3 h-3" /> Activo
                                </div>
                            </div>

                            <CardContent className="relative z-10 p-6 flex flex-col gap-4 mt-auto">
                                <div className="space-y-2">
                                    <h3 className={`text-xl font-extrabold tracking-tight leading-tight ${isSelected ? "text-emerald-50" : "text-zinc-100"}`}>
                                        {format.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {format.desc}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="text-[10px] font-medium text-emerald-500/70 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                                        <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
                                        INSTRUCCIÓN PARA IA
                                    </div>
                                    <p className="text-xs text-zinc-600 font-mono line-clamp-2">
                                        "{format.title.toLowerCase()} style ad format for conversion. Highly detailed."
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-6 border-t border-white/10">
                <p className="text-sm text-amber-500/80 flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span> Solo los estilos marcados como <strong>Activos</strong> serán utilizados.
                </p>
                <Button
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base"
                >
                    Siguiente: Estilo Visual <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}
