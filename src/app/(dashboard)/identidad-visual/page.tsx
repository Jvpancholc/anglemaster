"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store";
import { LogoEditorModal } from "./components/LogoEditorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Palette, Type, Image as ImageIcon, Sparkles, Save, Wand2, UploadCloud, UserCircle, ImagePlus } from "lucide-react";

export default function IdentidadVisualPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId } = useProjectStore();

    const [primaryColor, setPrimaryColor] = useState("#6366F1");
    const [secondaryColor, setSecondaryColor] = useState("#A855F7");
    const [selectedFont, setSelectedFont] = useState("Inter");
    const [fontPreviewText, setFontPreviewText] = useState("Ángulos ganadores.");
    const [slogan, setSlogan] = useState("");
    const [includeSlogan, setIncludeSlogan] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingImage, setPendingImage] = useState<string | null>(null);

    useEffect(() => {
        if (!activeProjectId) {
            toast.error("Por favor, crea o selecciona un proyecto primero.");
            router.push("/dashboard");
        }
    }, [activeProjectId, router]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error("El archivo excede el tamaño máximo permitido (2MB).");
            return;
        }
        setPendingImage(URL.createObjectURL(file));
        setPendingFile(file);
        setIsEditorOpen(true);
        e.target.value = "";
    };

    const handleSaveCrop = (croppedFile: File) => {
        setLogoFile(croppedFile);
        setLogoPreview(URL.createObjectURL(croppedFile));
        setIsEditorOpen(false);
    };

    const handleSkipCrop = () => {
        if (pendingFile) {
            setLogoFile(pendingFile);
            setLogoPreview(pendingImage);
        }
        setIsEditorOpen(false);
    };

    const handleAISelectLogo = async (url: string) => {
        setLogoPreview(url);
        setLogoUrl(url);
    };

    const handleSave = async () => {
        if (!activeProjectId) {
            toast.error("No hay un proyecto activo");
            return;
        }
        if (!user) {
            toast.error("Usuario no autenticado");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Guardando identidad visual...");

        try {
            const token = await getToken({ template: "supabase" });
            if (!token) throw new Error("No se pudo obtener el token de autenticación");

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            // Intentar auto-crear buckets 
            try { await fetch('/api/init-bucket', { method: 'POST' }); } catch (e) { }

            let finalLogoUrl = logoUrl;

            // Upload photo
            if (logoFile) {
                const fileExt = logoFile.name.split(".").pop();
                const fileName = `${activeProjectId}/${Date.now()}_logo.${fileExt}`;
                const { error: uploadError } = await supabaseAuth.storage
                    .from("logos")
                    .upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error(`Error al subir logo: ${uploadError.message}`);

                const { data: publicUrlData } = supabaseAuth.storage.from("logos").getPublicUrl(fileName);
                finalLogoUrl = publicUrlData.publicUrl;
            }

            const dataToSave = {
                project_id: activeProjectId,
                user_id: user.id,
                logo_url: finalLogoUrl,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                font: selectedFont,
                slogan: slogan,
                include_slogan: includeSlogan,
                // face_images: uploadedFaceUrls // Requiere columna 'face_images' en base de datos
            };

            const { error } = await supabaseAuth
                .from("brand_identity")
                .upsert(dataToSave, { onConflict: "project_id" });

            if (error) throw error;

            toast.success("¡Identidad visual guardada con éxito!", { id: toastId });
            router.push("/formato-creativo");
        } catch (error: any) {
            console.error("Error al guardar:", error);
            toast.error(error.message || "Error al guardar la identidad visual", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            <div className="text-center sm:text-left flex flex-col items-center sm:items-start p-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-400 font-medium mb-4">
                    <Palette className="w-3.5 h-3.5" />
                    Kit de Marca
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Identidad <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-500">Visual</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl">
                    Define la caja de herramientas de tu marca. Estos elementos guiarán todas las creaciones que la IA realice para tu cuenta.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Logo y Slogan */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-zinc-950/60 border-white/10 shadow-2xl relative overflow-hidden group hover:border-fuchsia-500/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ImageIcon className="w-24 h-24" />
                        </div>
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-fuchsia-400" />
                                Logo Principal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/40 hover:bg-black/60 transition-colors relative group/upload">
                                {logoPreview ? (
                                    <div className="relative w-full aspect-square max-h-[160px] flex items-center justify-center">
                                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain drop-shadow-lg" />
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                            <UploadCloud className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <span className="text-sm text-zinc-400">Sube tu logo (PNG, JPG)</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover/upload:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity">
                                    <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white" onClick={() => document.getElementById("logo-upload")?.click()}>
                                        Cambiar Logo
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setIsEditorOpen(true)} disabled={!logoFile && !logoPreview}>
                                        Ajustar Recorte
                                    </Button>
                                </div>
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/60 border-white/10 shadow-lg">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                Slogan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <Textarea
                                value={slogan}
                                onChange={(e) => setSlogan(e.target.value)}
                                placeholder="Ej. El futuro del comercio..."
                                className="bg-black/40 border-white/10 resize-none h-20 focus-visible:ring-fuchsia-500 text-zinc-200 rounded-xl"
                            />
                            <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                <Checkbox
                                    id="include-slogan"
                                    checked={includeSlogan}
                                    onCheckedChange={(checked) => setIncludeSlogan(checked as boolean)}
                                    className="data-[state=checked]:bg-fuchsia-500 data-[state=checked]:text-white border-white/20"
                                />
                                <Label htmlFor="include-slogan" className="text-sm text-zinc-300 cursor-pointer">
                                    Mostrar frase en anuncios
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Colores y Tipografía */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="bg-zinc-950/60 border-white/10 shadow-2xl relative">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xl text-white flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-400" />
                                Paleta Corporativa
                            </CardTitle>
                            <CardDescription>Esta paleta dictará la interfaz de los creativos.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Color Primario</Label>
                                <div className="flex gap-3">
                                    <div className="relative group">
                                        <div className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg overflow-hidden group-hover:scale-105 transition-transform" style={{ backgroundColor: primaryColor }}>
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="flex-1 bg-black/40 border-white/10 font-mono text-center text-lg h-14 rounded-xl focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Color Secundario</Label>
                                <div className="flex gap-3">
                                    <div className="relative group">
                                        <div className="w-14 h-14 rounded-xl border-2 border-white/20 shadow-lg overflow-hidden group-hover:scale-105 transition-transform" style={{ backgroundColor: secondaryColor }}>
                                            <input
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="absolute inset-[-10px] w-20 h-20 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <Input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="flex-1 bg-black/40 border-white/10 font-mono text-center text-lg h-14 rounded-xl focus-visible:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/60 border-white/10 shadow-2xl flex-1 flex flex-col justify-between">
                        <div>
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    <Type className="w-5 h-5 text-sky-400" />
                                    Tipografía
                                </CardTitle>
                                <CardDescription>La letra principal para tus slogans y encabezados promocionales.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Select value={selectedFont} onValueChange={setSelectedFont}>
                                    <SelectTrigger className="w-full bg-black/40 border-white/10 h-14 text-lg rounded-xl focus:ring-sky-500 transition-colors">
                                        <SelectValue placeholder="Selecciona una fuente" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectGroup>
                                            <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold">Sans Serif (Modernas & Limpias)</SelectLabel>
                                            <SelectItem value="Inter">Inter</SelectItem>
                                            <SelectItem value="Roboto">Roboto</SelectItem>
                                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                                            <SelectItem value="Lato">Lato</SelectItem>
                                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                                            <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold mt-2">Serif (Clásicas & Elegantes)</SelectLabel>
                                            <SelectItem value="PT Serif">PT Serif</SelectItem>
                                            <SelectItem value="Merriweather">Merriweather</SelectItem>
                                            <SelectItem value="Slabo 27px">Slabo 27px</SelectItem>
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold mt-2">Display (Impactantes)</SelectLabel>
                                            <SelectItem value="Oswald">Oswald</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {/* Vista previa tipografía */}
                                <div className="mt-8 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Texto de Prueba</Label>
                                        <Input
                                            value={fontPreviewText}
                                            onChange={(e) => setFontPreviewText(e.target.value)}
                                            placeholder="Escribe algo para probar la fuente..."
                                            className="bg-black/30 border-white/10 focus-visible:ring-sky-500"
                                        />
                                    </div>
                                    <div className="p-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/5 rounded-xl text-center min-h-[120px] flex items-center justify-center overflow-hidden">
                                        <p className="text-3xl sm:text-4xl text-white tracking-tight break-words max-w-full" style={{ fontFamily: selectedFont }}>
                                            {fontPreviewText || "Escribe algo..."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-all px-8 py-6 rounded-full w-full sm:w-auto text-base"
                            >
                                {isSaving ? (
                                    "Guardando..."
                                ) : (
                                    <><Save className="w-5 h-5 mr-2" /> Confirmar Identidad</>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Sección Recursos IA Eliminada para evitar duplicidad */}

            <LogoEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                imageSrc={pendingImage || ""}
                onSave={handleSaveCrop}
                onSkip={handleSkipCrop}
            />
        </div>
    );
}
