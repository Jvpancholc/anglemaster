"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Smartphone, Laptop, LayoutTemplate, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const FORMAT_OPTIONS = [
    {
        id: "square",
        title: "Feed Cuadrado",
        desc: "1080 x 1080 px (1:1)",
        icon: ImageIcon,
        text: "Ideal para Facebook Feed, Instagram Feed y Carruseles.",
        activeColor: "orange"
    },
    {
        id: "story",
        title: "Story & Reels",
        desc: "1080 x 1920 px (9:16)",
        icon: Smartphone,
        text: "Óptimo para Instagram Reels, TikTok y YouTube Shorts.",
        activeColor: "orange"
    },
    {
        id: "landscape",
        title: "Paisaje",
        desc: "1200 x 628 px (1.91:1)",
        icon: Laptop,
        text: "Para artículos, Facebook in-stream o anuncios en display.",
        activeColor: "orange"
    }
];

export default function FormatoCreativoPage() {
    const { activeProjectId } = useProjectStore();
    const router = useRouter();
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!activeProjectId) {
            toast.error("Ningún proyecto activo. Selecciona o crea uno en el Dashboard.");
            router.push("/");
            return;
        }

        const loadFormats = async () => {
            try {
                const { data, error } = await supabase
                    .from("creative_formats")
                    .select("formats")
                    .eq("project_id", activeProjectId)
                    .maybeSingle();

                if (error && error.code !== "PGRST116") throw error;

                if (data && data.formats) {
                    setSelectedFormats(data.formats);
                }
            } catch (error) {
                console.error("Error loading formats:", error);
                toast.error("Error al cargar los formatos guardados.");
            } finally {
                setLoading(false);
            }
        };

        loadFormats();
    }, [activeProjectId, router]);

    const toggleFormat = (id: string) => {
        setSelectedFormats(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!activeProjectId) return;
        setSaving(true);

        try {
            // Revisa si existe para hacer un update o insert
            const { data: existing } = await supabase
                .from("creative_formats")
                .select("id")
                .eq("project_id", activeProjectId)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from("creative_formats")
                    .update({ formats: selectedFormats, updated_at: new Date().toISOString() })
                    .eq("project_id", activeProjectId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("creative_formats")
                    .insert({ project_id: activeProjectId, formats: selectedFormats });
                if (error) throw error;
            }

            toast.success("Formatos guardados correctamente.");
        } catch (error) {
            console.error("Error saving formats:", error);
            toast.error("Hubo un problema al guardar los formatos.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-orange-500" />
                        Formatos Creativos
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Selecciona las dimensiones ideales para la plataforma en la que publicarás tus anuncios.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || selectedFormats.length === 0}
                    className="bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Formatos
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {FORMAT_OPTIONS.map((format) => {
                    const isSelected = selectedFormats.includes(format.id);
                    const Icon = format.icon;

                    return (
                        <Card
                            key={format.id}
                            onClick={() => toggleFormat(format.id)}
                            className={`relative overflow-hidden group cursor-pointer transition-all duration-300 ${isSelected
                                    ? "border-orange-500/50 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)] scale-[1.02]"
                                    : "border-white/5 bg-black/40 hover:bg-black/60 hover:border-white/10"
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 px-2 py-1 bg-orange-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-md animate-in zoom-in duration-300">
                                    Activo
                                </div>
                            )}
                            <CardHeader className="text-center pb-2 pt-8">
                                <Icon className={`w-12 h-12 mx-auto mb-4 transition-transform duration-500 ${isSelected ? "text-orange-400 scale-110" : "text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110"}`} />
                                <CardTitle className={isSelected ? "text-orange-100" : "text-zinc-200"}>{format.title}</CardTitle>
                                <CardDescription className={isSelected ? "text-orange-200/70" : ""}>{format.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-8">
                                <p className={`text-sm mb-6 mt-2 ${isSelected ? "text-orange-100/80" : "text-zinc-400"}`}>
                                    {format.text}
                                </p>
                                <div className={`w-full py-2 rounded-md text-sm font-medium transition-all duration-300 ${isSelected
                                        ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                        : "bg-white/5 text-zinc-400 border border-white/10 group-hover:bg-white/10 group-hover:text-zinc-200"
                                    }`}>
                                    {isSelected ? "Seleccionado" : "Seleccionar"}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-4 p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm flex gap-4 items-start">
                <LayoutTemplate className="w-6 h-6 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    <strong>Nota sobre formatos:</strong> Elegir múltiples formatos a la vez consumirá más créditos durante la generación en "La Fábrica",
                    pues la IA tendrá que renderizar variaciones de cada imagen para adaptarlas a las diferentes dimensiones. Te recomendamos empezar con el formato más relevante para tu campaña actual.
                </p>
            </div>
        </div>
    );
}
