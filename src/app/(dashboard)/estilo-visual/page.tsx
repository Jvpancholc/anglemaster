"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Image as ImageIcon, PenTool, Box, PlaySquare, Layout, Sparkles, ImagePlus, UploadCloud, User } from "lucide-react";
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

            {/* Sección Recursos IA */}
            <div className="space-y-6 mt-2">
                <Card className="bg-zinc-950/60 border-indigo-500/20 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                    <CardHeader className="border-b border-white/5 pb-4 relative z-10">
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Recursos Avanzados (Entrenamiento IA)
                        </CardTitle>
                        <CardDescription>Sube imágenes de referencia para dominar el renderizado final aportando el estilo o los rostros exactos a usar.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">

                        {/* Referencias de Estilo */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ImagePlus className="w-5 h-5 text-pink-400" />
                                <h3 className="font-semibold text-zinc-200">Referencias de Estilo <span className="text-xs text-zinc-500 font-normal">(Máx 2)</span></h3>
                            </div>
                            <p className="text-sm text-zinc-500">¿Tienes anuncios de la competencia o posts que te envuelven? Súbelos para calcar su esencia estética.</p>

                            <div
                                onClick={() => document.getElementById("style-upload")?.click()}
                                className="border-2 border-dashed border-white/10 p-6 rounded-xl bg-black/40 hover:bg-black/60 cursor-pointer transition-colors text-center"
                            >
                                <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <span className="text-sm text-zinc-400">Clic para subir imágenes de estilo</span>
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
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {styleReferenceFiles.map((f, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rostros y Personajes */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-sky-400" />
                                <h3 className="font-semibold text-zinc-200">Rostro / Personaje Principal <span className="text-xs text-zinc-500 font-normal">(Máx 4, Recomendado: 1)</span></h3>
                            </div>
                            <p className="text-sm text-zinc-500">Sube fotos frontales y claras de la persona que quieres que la IA posicione como el protagonista de tus artes.</p>

                            <div
                                onClick={() => document.getElementById("face-upload")?.click()}
                                className="border-2 border-dashed border-white/10 p-6 rounded-xl bg-black/40 hover:bg-black/60 cursor-pointer transition-colors text-center"
                            >
                                <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <span className="text-sm text-zinc-400">Clic para subir fotos de rostro</span>
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
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {faceImageFiles.map((f, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
                <p className="text-sm text-zinc-400 flex items-center gap-2">
                    <span className="text-fuchsia-500 text-lg">🎨</span> El estilo seleccionado se combinará con los <strong className="text-emerald-400">Formatos Creativos</strong>.
                </p>
                <Button
                    onClick={handleSave}
                    disabled={!selectedStyle || isSaving}
                    className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? "Guardando y Subiendo..." : <>Siguiente: Análisis IA <span className="ml-2 font-serif text-xl leading-none">→</span></>}
                </Button>
            </div>
        </div>
    );
}
