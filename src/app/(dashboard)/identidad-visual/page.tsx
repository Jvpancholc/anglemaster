"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Type, Palette, ArrowRight } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function IdentidadVisualPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [primaryColor, setPrimaryColor] = useState("#6366f1");
    const [secondaryColor, setSecondaryColor] = useState("#a855f7");
    const [typography, setTypography] = useState("Inter");

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
            setPrimaryColor(project.identity.primaryColor || "#6366f1");
            setSecondaryColor(project.identity.secondaryColor || "#a855f7");
            setTypography(project.identity.typography || "Inter");
        }
    }, [activeProjectId, projects, router]);

    const handleSave = () => {
        if (!activeProjectId) return;

        updateProject(activeProjectId, {
            identity: {
                ...projects.find(p => p.id === activeProjectId)?.identity,
                primaryColor,
                secondaryColor,
                typography
            }
        });

        toast.success("Identidad visual guardada exitosamente");
        router.push("/formato-creativo");
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identidad Visual</h1>
                <p className="text-muted-foreground mt-2">
                    Define los activos visuales de tu marca. La IA generará creativos alineados a esta guía.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 pointer-events-none" />
                <CardHeader className="relative z-10">
                    <CardTitle>Activos de Marca</CardTitle>
                    <CardDescription>
                        Asegúrate de mantener consistencia visual en todos tus anuncios.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">

                    {/* Sección Logo */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Upload className="w-4 h-4 text-pink-400" /> Logo Principal
                        </h3>
                        <div className="border-2 border-dashed border-white/20 rounded-xl bg-white/5 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition group">
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                <Upload className="w-8 h-8 text-zinc-300" />
                            </div>
                            <p className="text-zinc-200 font-medium mb-1">Haz clic para subir tu logo</p>
                            <p className="text-zinc-500 text-sm">PNG o SVG recomendado. Fondo transparente.</p>
                        </div>
                    </div>

                    {/* Sección Tipografía */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4 text-orange-400" /> Tipografía Principal
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {['Inter', 'Roboto', 'Playfair Display', 'Montserrat'].map((font) => (
                                <div
                                    key={font}
                                    onClick={() => setTypography(font)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all text-center ${typography === font
                                            ? "bg-orange-500/10 border-orange-500 text-orange-400 font-bold"
                                            : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                                        }`}
                                >
                                    <span style={{ fontFamily: font }}>Aa</span>
                                    <p className="text-xs mt-2">{font}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección Colores */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Palette className="w-4 h-4 text-fuchsia-400" /> Colores de Marca
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-6 bg-white/5 p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-zinc-200">Color Primario</label>
                                    <span className="text-xs text-zinc-500">Predominante</span>
                                </div>
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                                />
                                <div className="px-3 py-1 bg-black/50 rounded-md font-mono text-xs text-zinc-400 border border-white/10 uppercase">
                                    {primaryColor}
                                </div>
                            </div>

                            <div className="hidden sm:block w-px bg-white/10 mx-2" />

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-zinc-200">Color Secundario</label>
                                    <span className="text-xs text-zinc-500">Acentos</span>
                                </div>
                                <input
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                                />
                                <div className="px-3 py-1 bg-black/50 rounded-md font-mono text-xs text-zinc-400 border border-white/10 uppercase">
                                    {secondaryColor}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-semibold shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all px-8 py-5 rounded-full"
                        >
                            Guardar Identidad Visual <ArrowRight className="w-4 h-4 ml-2 mt-0.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
