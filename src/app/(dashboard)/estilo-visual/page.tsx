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

    const [styleReferenceFiles, setStyleReferenceFiles] = useState<File[]>([]);
    const [faceImageFiles, setFaceImageFiles] = useState<File[]>([]);
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

    const handleStyleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setStyleReferenceFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 2) {
                    toast.warning("Solo puedes subir un máximo de 2 referencias. Se han descartado algunas.");
                    return combined.slice(0, 2);
                }
                return combined;
            });
        }
    };

    const handleFaceFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFaceImageFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 4) {
                    toast.warning("Solo puedes subir un máximo de 4 rostros. Se han descartado algunos.");
                    return combined.slice(0, 4);
                }
                return combined;
            });
        }
    };

    const handleSave = async () => {
        if (!activeProjectId || !selectedStyle) return;
        setIsSaving(true);
        const toastId = toast.loading("Guardando estilo visual y recursos...");

        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error("No autenticado");
            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            // Upload styles
            const uploadedStyleUrls: string[] = [];
            for (const file of styleReferenceFiles) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${activeProjectId}/${Date.now()}_style_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabaseAuth.storage
                    .from("style-references")
                    .upload(fileName, file, { upsert: true });

                if (!uploadError) {
                    const { data } = supabaseAuth.storage.from("style-references").getPublicUrl(fileName);
                    uploadedStyleUrls.push(data.publicUrl);
                } else {
                    console.error("Error subiendo referencia de estilo:", uploadError);
                }
            }

            // Upload faces
            const uploadedFaceUrls: string[] = [];
            for (const file of faceImageFiles) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${activeProjectId}/${Date.now()}_face_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabaseAuth.storage
                    .from("face-images")
                    .upload(fileName, file, { upsert: true });

                if (!uploadError) {
                    const { data } = supabaseAuth.storage.from("face-images").getPublicUrl(fileName);
                    uploadedFaceUrls.push(data.publicUrl);
                } else {
                    console.error("Error subiendo foto de rostro:", uploadError);
                }
            }

            const project = projects.find(p => p.id === activeProjectId);

            updateProject(activeProjectId, {
                visualStyle: selectedStyle,
                identity: {
                    ...(project?.identity || {} as any),
                    styleReferences: uploadedStyleUrls.length > 0 ? uploadedStyleUrls : project?.identity.styleReferences,
                    faceImages: uploadedFaceUrls.length > 0 ? uploadedFaceUrls : project?.identity.faceImages,
                }
            });

            toast.success("Estilo visual guardado.", { id: toastId });
            router.push("/analisis-ia");
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
                        Fase 2: Espionaje Visual
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
                        Espionaje <span className="text-indigo-400">Visual</span>
                    </h1>
                    <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
                        Sube contenido que la IA debe analizar. Entre mejor la referencia, mejor el resultado final. Combina un estilo base con tus imágenes de competencia y rostros.
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

            {/* Espionaje AI Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* Competence References */}
                <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ImagePlus className="w-5 h-5 text-pink-400" />
                            <h3 className="font-bold text-white text-lg">Referencias de Competencia</h3>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Sube anuncios, posts o artes visuales de tu competencia o inspiración. La IA calcará su composición visual.
                        </p>
                    </div>

                    <div
                        onClick={() => document.getElementById("style-upload")?.click()}
                        className="mt-2 border-2 border-dashed border-white/10 p-8 rounded-xl bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center flex flex-col items-center justify-center"
                    >
                        <UploadCloud className="w-8 h-8 text-zinc-600 mb-3" />
                        <span className="text-sm font-medium text-zinc-400">Click para subir (Máx 2)</span>
                        <input
                            id="style-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleStyleFilesChange}
                        />
                    </div>

                    {styleReferenceFiles.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-2">
                            {styleReferenceFiles.map((f, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group/img">
                                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setStyleReferenceFiles(prev => prev.filter((_, i) => i !== idx));
                                    }} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                                        Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Faces References */}
                <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-sky-400" />
                            <h3 className="font-bold text-white text-lg">Fotos de Rostro <span className="text-zinc-500 font-normal text-sm">(Opcional)</span></h3>
                        </div>
                        <p className="text-xs text-zinc-500">
                            ¿Quieres que la IA use tu rostro o el de tu cliente? Sube 1 a 4 fotos claras, mirando al frente, con buena iluminación.
                        </p>
                    </div>

                    <div
                        onClick={() => document.getElementById("face-upload")?.click()}
                        className="mt-2 border-2 border-dashed border-white/10 p-8 rounded-xl bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center flex flex-col items-center justify-center"
                    >
                        <UploadCloud className="w-8 h-8 text-zinc-600 mb-3" />
                        <span className="text-sm font-medium text-zinc-400">Click para subir (Máx 4)</span>
                        <input
                            id="face-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleFaceFilesChange}
                        />
                    </div>

                    {faceImageFiles.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-2">
                            {faceImageFiles.map((f, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group/img">
                                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setFaceImageFiles(prev => prev.filter((_, i) => i !== idx));
                                    }} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                                        Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
        </div>
    );
}
