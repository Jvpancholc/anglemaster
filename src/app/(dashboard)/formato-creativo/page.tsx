"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const FORMAT_OPTIONS = [
    {
        id: "noticiero",
        title: "Noticiero",
        desc: "Autoridad inmediata. Presentador de noticias.",
        color: "emerald",
        instruction: '"Cinematic News Anchor Style. A hyper-realistic professional news presenter sitting at a modern glass desk in a high-tech TV studio. "BREAKING NEWS" lower-third graphic (Red and White). Bright studio lighting, 8k resolution, depth of field behind the anchor. The anchor is looking directly at the camera with a serious, urgent expression. TV Broadcast Quality."',
        image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=400&h=400"
    },
    {
        id: "infografia-cta",
        title: "Infografía con Texto + CTA",
        desc: "Educativo con llamada a la acción clara.",
        color: "emerald",
        instruction: '"High-Conversion Infographic Style. Clean, structured layout with whitespace. 3D rendered product centered. Bold floating text boxes highlighting 3 main benefits. Vector icons next to text. A bright, unmissable "Shop Now" button integrated into the design at the bottom. Studio lighting, sharp vector-like crispness."',
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=400"
    },
    {
        id: "infografia-hook",
        title: "Infografía solo con 'Hook'",
        desc: "Gancho visual viral con título gigante.",
        color: "emerald",
        instruction: '"Viral Social Media Hook Style. Massive, bold typography overlay taking up the top 30% of the image. The text is high-contrast (Yellow on Black or White on Red). Below the text, a highly emotive face reacting with shock or excitement pointing at the product. High saturation, TikTok/Reels thumbnail aesthetic."',
        image: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=400&h=400"
    },
    {
        id: "antes-despues",
        title: "Antes y Después",
        desc: "Comparativa impactante de transformación.",
        color: "emerald",
        instruction: '"Split Screen "Before & After" Comparison. LEFT SIDE (The Problem): Desaturated, gloomy lighting, chaotic or frustrating scene. RIGHT SIDE (The Solution using the product): Bright, vibrant colors, sunny lighting, happy and organized scene. A clear white line dividing the two halves. High contrast storytelling."',
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=400&h=400"
    }
];

export default function FormatoCreativoPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const { t } = useTranslation();

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
        setSelectedFormats(prev => {
            const isCurrentlySelected = prev.includes(id);
            if (!isCurrentlySelected && prev.length >= 3) {
                toast.error(t.formatoCreativo.errMaxFormatos);
                return prev;
            }
            return isCurrentlySelected ? prev.filter(f => f !== id) : [...prev, id];
        });
    };

    const handleSave = () => {
        if (!activeProjectId) return;

        if (selectedFormats.length === 0) {
            toast.error(t.formatoCreativo.errMinFormatos);
            return;
        }

        updateProject(activeProjectId, {
            creativeFormats: selectedFormats
        });

        toast.success(t.formatoCreativo.formatosGuardados);
        router.push("/estilo-visual");
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.formatoCreativo.badge}
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">{t.formatoCreativo.title}</h1>
                <p className="text-zinc-400 text-lg max-w-2xl text-balance">
                    {t.formatoCreativo.desc}
                </p>
                <div className="mt-4 px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-lg flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{t.formatoCreativo.formatosSeleccionados}</span>
                    <span className={`text-lg font-bold ${selectedFormats.length === 3 ? 'text-amber-500' : 'text-emerald-400'}`}>
                        {selectedFormats.length} / 3
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {FORMAT_OPTIONS.map((format) => {
                    const isSelected = selectedFormats.includes(format.id);

                    return (
                        <Card
                            key={format.id}
                            onClick={() => toggleFormat(format.id)}
                            className={`relative overflow-hidden group cursor-pointer transition-all duration-500 flex flex-col justify-start
                                ${isSelected
                                    ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                                    : "border-white/10 bg-zinc-950/60 hover:border-white/30"
                                }
                            `}
                        >
                            {/* Image Header */}
                            <div className="w-full h-48 relative overflow-hidden bg-zinc-900">
                                <img
                                    src={format.image}
                                    alt={format.title}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-105 opacity-100' : 'scale-100 opacity-60 group-hover:opacity-80'}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />

                                {/* Active Badge */}
                                <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                                    <div className="px-3 py-1 bg-emerald-500 text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-lg">
                                        <CheckCircle2 className="w-3 h-3" /> {t.formatoCreativo.activo}
                                    </div>
                                </div>
                            </div>


                            <CardContent className="relative z-10 p-6 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <h3 className={`text-xl font-extrabold tracking-tight leading-tight ${isSelected ? "text-emerald-400" : "text-zinc-100"}`}>
                                        {format.id === "noticiero" ? t.formatoCreativo.optNoticieroTitle :
                                            format.id === "infografia-cta" ? t.formatoCreativo.optInfografiaCtaTitle :
                                                format.id === "infografia-hook" ? t.formatoCreativo.optInfografiaHookTitle :
                                                    t.formatoCreativo.optAntesDespuesTitle}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {format.id === "noticiero" ? t.formatoCreativo.optNoticieroDesc :
                                            format.id === "infografia-cta" ? t.formatoCreativo.optInfografiaCtaDesc :
                                                format.id === "infografia-hook" ? t.formatoCreativo.optInfografiaHookDesc :
                                                    t.formatoCreativo.optAntesDespuesDesc}
                                    </p>
                                </div>

                                {/* Expandable Accordion for Instructions */}
                                <div
                                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isSelected ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 m-0'}`}
                                >
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="text-[10px] font-medium text-emerald-500/70 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                                            <div className="w-1 h-3 bg-emerald-500/50 rounded-full" />
                                            {t.formatoCreativo.instruccionIa}
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/10 text-xs text-zinc-400 font-mono leading-relaxed">
                                            {format.instruction}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-6 border-t border-white/10">
                <p className="text-sm text-amber-500/80 flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span> {t.formatoCreativo.avisoActivos}
                </p>
                <Button
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base"
                >
                    {t.formatoCreativo.btnSiguiente} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}
