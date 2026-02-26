"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles, UploadCloud, User, ImagePlus, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "@/lib/i18n";

export default function SimilitudIAPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    const [styleReferenceFiles, setStyleReferenceFiles] = useState<File[]>([]);
    const [faceImageFiles, setFaceImageFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }
    }, [activeProjectId, router]);

    const handleStyleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setStyleReferenceFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 2) {
                    toast.warning("Solo puedes subir un máximo de 2 referencias.");
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
                    toast.warning("Solo puedes subir un máximo de 4 rostros.");
                    return combined.slice(0, 4);
                }
                return combined;
            });
        }
    };

    const handleSave = async () => {
        if (!activeProjectId) return;
        setIsSaving(true);
        const toastId = toast.loading(t.similitud.guardando);

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
                }
            }

            const project = projects.find(p => p.id === activeProjectId);

            updateProject(activeProjectId, {
                identity: {
                    ...(project?.identity || {} as any),
                    styleReferences: uploadedStyleUrls.length > 0 ? uploadedStyleUrls : project?.identity.styleReferences,
                    faceImages: uploadedFaceUrls.length > 0 ? uploadedFaceUrls : project?.identity.faceImages,
                }
            });

            toast.success("Referencias guardadas con éxito.", { id: toastId });
            router.push("/analisis-ia");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar referencias", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                <div className="text-center sm:text-left flex flex-col items-center sm:items-start text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-sky-400 font-medium mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t.similitud.fase}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
                        {t.similitud.title} <span className="text-sky-400">IA</span>
                    </h1>
                    <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed">
                        {t.similitud.subtitle}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ImagePlus className="w-5 h-5 text-pink-400" />
                            <h3 className="font-bold text-white text-lg">{t.similitud.subirRef}</h3>
                        </div>
                        <p className="text-xs text-zinc-500">
                            {t.similitud.arrastraRef}
                        </p>
                    </div>

                    <div
                        onClick={() => document.getElementById("style-upload")?.click()}
                        className="mt-2 border-2 border-dashed border-white/10 p-8 rounded-xl bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center flex flex-col items-center justify-center"
                    >
                        <UploadCloud className="w-8 h-8 text-zinc-600 mb-3" />
                        <span className="text-sm font-medium text-zinc-400">{t.similitud.clickSubir}</span>
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
                                        {t.similitud.quitar}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[#0e0e12] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-sky-400" />
                            <h3 className="font-bold text-white text-lg">{t.similitud.fotosRostro} <span className="text-zinc-500 font-normal text-sm">{t.similitud.opcional}</span></h3>
                        </div>
                        <p className="text-xs text-zinc-500">
                            {t.similitud.quieresGenerar}
                        </p>
                    </div>

                    <div
                        onClick={() => document.getElementById("face-upload")?.click()}
                        className="mt-2 border-2 border-dashed border-white/10 p-8 rounded-xl bg-black/20 hover:bg-white/5 cursor-pointer transition-colors text-center flex flex-col items-center justify-center"
                    >
                        <UploadCloud className="w-8 h-8 text-zinc-600 mb-3" />
                        <span className="text-sm font-medium text-zinc-400">{t.similitud.clickSubirRostro}</span>
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
                                        {t.similitud.quitar}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="sticky bottom-6 mt-4 p-4 rounded-2xl bg-[#111116] border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl z-10 w-full">
                <div className="text-sm text-zinc-400 flex items-center gap-2 px-2">
                    <Sparkles className="w-4 h-4 text-sky-400" /> {t.similitud.pasoCerca}
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold transition-all px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    {isSaving ? t.similitud.guardando : t.similitud.guardarRef}
                    {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
}
