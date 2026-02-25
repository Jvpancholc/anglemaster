"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Type, Palette, ArrowRight, Loader2, Image as ImageIcon, MessageSquare, Crop, Sparkles } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { createClient } from "@supabase/supabase-js";
import { TypographySelector } from "./components/TypographySelector";
import { LogoEditorModal } from "./components/LogoEditorModal";
import { AILogoGeneratorModal } from "./components/AILogoGeneratorModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl || "https://mock.supabase.co", supabaseAnonKey || "mock-key");

export default function IdentidadVisualPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [primaryColor, setPrimaryColor] = useState("#6366f1");
    const [secondaryColor, setSecondaryColor] = useState("#a855f7");
    const [typography, setTypography] = useState("");
    const [slogan, setSlogan] = useState("");
    const [includeSlogan, setIncludeSlogan] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [logoUrl, setLogoUrl] = useState<string>("");

    // Modal Crop states
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState<string>("");
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    // Modal AI Generator states
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
            setPrimaryColor(project.identity?.primaryColor || "#6366f1");
            setSecondaryColor(project.identity?.secondaryColor || "#a855f7");
            setTypography(project.identity?.typography || "");
            setSlogan(project.identity?.slogan || "");
            setIncludeSlogan(project.identity?.includeSlogan || false);

            const existingLogoUrl = project.identity?.logoUrl;
            if (existingLogoUrl) {
                setLogoUrl(existingLogoUrl);
                setLogoPreview(existingLogoUrl);
            }
        }
    }, [activeProjectId, projects, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("El archivo excede el tamaño máximo permitido (2MB).");
                return;
            }
            // Open editor modal
            setPendingImage(URL.createObjectURL(file));
            setPendingFile(file);
            setIsEditorOpen(true);

            // Clear input value so selecting the same file triggers onChange again
            e.target.value = "";
        }
    };

    const handleSaveCrop = (croppedFile: File) => {
        setLogoFile(croppedFile);
        setLogoPreview(URL.createObjectURL(croppedFile));
    };

    const handleSkipCrop = () => {
        if (pendingFile) {
            setLogoFile(pendingFile);
            setLogoPreview(pendingImage);
        }
        setIsEditorOpen(false);
    };

    const handleAISelectLogo = async (url: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], `ai_generated_logo_${Date.now()}.png`, { type: blob.type });

            // Pass to crop modal
            setPendingImage(URL.createObjectURL(file));
            setPendingFile(file);
            setIsEditorOpen(true);
        } catch (err) {
            console.warn("Could not fetch the URL directly due to CORS, saving direct URL visually.", err);
            // Fallback: Just set the URL directly as if they uploaded it.
            setLogoPreview(url);
            setLogoUrl(url);
        }
    };

    const handleSave = async () => {
        if (!activeProjectId) return;
        setIsSaving(true);

        const finalTypography = typography || "Inter"; // Fallback to Inter if empty
        let finalLogoUrl = logoUrl;

        try {
            // Attempt to initialize bucket automatically before interacting with storage
            if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co") {
                try {
                    await fetch('/api/init-bucket', { method: 'POST' });
                } catch (e) {
                    // Ignore, we will handle the actual upload error if it fails
                }
            }

            if (logoFile) {
                if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co") {
                    const fileExt = logoFile.name.split('.').pop();
                    const fileName = `${activeProjectId}/${Date.now()}_logo.${fileExt}`;

                    const { data, error } = await supabase.storage
                        .from('logos')
                        .upload(fileName, logoFile, {
                            upsert: true,
                            contentType: logoFile.type
                        });

                    if (error) {
                        console.error("Supabase Storage Error:", error);
                        const msg = error.message.toLowerCase();
                        if (msg.includes('bucket') && msg.includes('not found')) {
                            toast.error("El bucket 'logos' no existe en Supabase y no pudo ser creado automáticamente.", { duration: 5000 });
                            toast.info("Por favor, ve al Dashboard de Supabase > Storage y crea un bucket Público llamado 'logos'.", {
                                duration: 15000,
                            });
                        } else {
                            toast.error(`Error al subir imagen: ${error.message}`);
                        }
                        setIsSaving(false);
                        return; // Stop execution
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('logos')
                        .getPublicUrl(fileName);

                    finalLogoUrl = publicUrlData.publicUrl;
                } else {
                    toast.info("Modo demostración: Supabase no configurado, guardando URL local.");
                    finalLogoUrl = logoPreview;
                }
            }

            if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co") {
                const { error: dbError } = await supabase
                    .from('brand_identity')
                    .upsert({
                        project_id: activeProjectId,
                        logo_url: finalLogoUrl || null,
                        primary_color: primaryColor,
                        secondary_color: secondaryColor,
                        font: finalTypography,
                        slogan: slogan,
                        include_slogan: includeSlogan
                    }, { onConflict: 'project_id' });

                if (dbError) {
                    console.warn("No se pudo insertar en la tabla brand_identity:", dbError);
                }
            }

            updateProject(activeProjectId, {
                identity: {
                    ...projects.find(p => p.id === activeProjectId)?.identity,
                    primaryColor,
                    secondaryColor,
                    typography: finalTypography,
                    slogan,
                    includeSlogan,
                    logoUrl: finalLogoUrl
                } as any
            });

            setLogoUrl(finalLogoUrl);

            toast.success("Identidad visual guardada exitosamente");

        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message || "Ocurrió un error inesperado al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            <LogoEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                imageSrc={pendingImage}
                onSave={handleSaveCrop}
                onSkip={handleSkipCrop}
            />

            {/* AI Logo Generator Modal */}
            <AILogoGeneratorModal
                isOpen={isAIGeneratorOpen}
                onClose={() => setIsAIGeneratorOpen(false)}
                onSelectLogo={handleAISelectLogo}
            />

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identidad Visual</h1>
                <p className="text-muted-foreground mt-2">
                    Define los activos visuales de tu marca. La IA generará creativos alineados a esta guía.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-orange-500/5 pointer-events-none" />
                <CardHeader className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <CardTitle>Activos de Marca</CardTitle>
                        <CardDescription>
                            Asegúrate de mantener consistencia visual en todos tus anuncios.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 relative z-10">

                    {/* Logo Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-pink-400" /> Logo Principal
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAIGeneratorOpen(true)}
                                className="bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generar logo con IA
                            </Button>
                        </div>

                        <div className="border-2 border-dashed border-white/20 rounded-xl bg-black/40 p-8 flex flex-col items-center justify-center relative overflow-hidden group min-h-[250px]">
                            <input
                                id="logo-upload"
                                type="file"
                                accept="image/png, image/jpeg, image/svg+xml"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {logoPreview ? (
                                <div className="flex flex-col items-center w-full relative z-10">
                                    <div className="w-40 h-40 mb-4 bg-zinc-900/50 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 p-4 shadow-lg group-hover:scale-105 transition duration-500">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                            className="bg-black/50 hover:bg-black text-white border border-white/10"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Cambiar
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setPendingImage(logoPreview);
                                                setIsEditorOpen(true);
                                            }}
                                            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                                        >
                                            <Crop className="w-4 h-4 mr-2" />
                                            Recortar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex flex-col justify-center items-center w-full h-full cursor-pointer absolute inset-0 z-0 hover:bg-white/5 transition"
                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-lg">
                                        <Upload className="w-8 h-8 text-zinc-300 group-hover:text-white transition" />
                                    </div>
                                    <p className="text-zinc-100 font-medium mb-1 group-hover:underline">Haz clic para subir tu logo</p>
                                    <p className="text-zinc-500 text-sm">PNG, JPG o SVG (máx. 2MB). Fondo transparente recomendado.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Slogan Section */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-cyan-400" /> Slogan de la Marca (Opcional)
                            </h3>
                            {slogan.trim().length > 0 && (
                                <div className="flex items-center space-x-2 animate-in fade-in">
                                    <Switch
                                        id="include-slogan"
                                        checked={includeSlogan}
                                        onCheckedChange={setIncludeSlogan}
                                    />
                                    <label
                                        htmlFor="include-slogan"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300 cursor-pointer"
                                    >
                                        Incluir en anuncios
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                placeholder="Ej. Simplificando el comercio digital. (Déjalo en blanco si no tienes)"
                                value={slogan}
                                onChange={(e) => {
                                    setSlogan(e.target.value);
                                    if (e.target.value.trim().length === 0) setIncludeSlogan(false);
                                }}
                                className="bg-black/40 border-white/10 text-base py-6 focus-visible:ring-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Typography Section */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4 text-orange-400" /> Tipografía Principal
                        </h3>
                        <TypographySelector
                            selectedFont={typography}
                            onSelectFont={setTypography}
                        />
                    </div>

                    {/* Colors Section */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Palette className="w-4 h-4 text-fuchsia-400" /> Colores de Marca
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-6 bg-black/40 p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex flex-col flex-1">
                                    <label className="text-sm font-medium text-zinc-200">Color Primario</label>
                                    <span className="text-xs text-zinc-500">Predominante</span>
                                </div>
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-0 p-0 absolute opacity-0 z-10 inset-0"
                                    />
                                    <div
                                        className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg group-hover:scale-105 transition-transform"
                                        style={{ backgroundColor: primaryColor }}
                                    />
                                </div>
                                <div className="px-3 py-1.5 bg-black/60 rounded-md font-mono text-sm text-zinc-300 border border-white/10 uppercase w-24 text-center">
                                    {primaryColor}
                                </div>
                            </div>

                            <div className="hidden sm:block w-px bg-white/10 mx-2" />
                            <div className="sm:hidden h-px w-full bg-white/10 my-2" />

                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex flex-col flex-1">
                                    <label className="text-sm font-medium text-zinc-200">Color Secundario</label>
                                    <span className="text-xs text-zinc-500">Acentos</span>
                                </div>
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="w-14 h-14 rounded-xl cursor-pointer bg-transparent border-0 p-0 absolute opacity-0 z-10 inset-0"
                                    />
                                    <div
                                        className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg group-hover:scale-105 transition-transform"
                                        style={{ backgroundColor: secondaryColor }}
                                    />
                                </div>
                                <div className="px-3 py-1.5 bg-black/60 rounded-md font-mono text-sm text-zinc-300 border border-white/10 uppercase w-24 text-center">
                                    {secondaryColor}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !typography}
                            className={`font-semibold shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all px-8 py-6 rounded-full text-base ${!typography
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10"
                                    : "bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white border-0"
                                }`}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Guardando Identidad...</span>
                            ) : (
                                <span className="flex items-center gap-2">Guardar Identidad Visual <ArrowRight className="w-5 h-5 mt-0.5" /></span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
