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
import { Checkbox } from "@/components/ui/checkbox";
import { Palette, Type, Image as ImageIcon, Sparkles, Save, UploadCloud, Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function IdentidadVisualPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects } = useProjectStore();

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
    const { t } = useTranslation();

    // Get current project info for the mockup
    const activeProject = projects.find(p => p.id === activeProjectId);
    const businessName = activeProject?.name || "Mi Negocio";

    useEffect(() => {
        if (!activeProjectId) {
            toast.error(t.identidadVisual.errProjUrl);
            router.push("/dashboard");
        }
    }, [activeProjectId, router]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t.identidadVisual.errSize);
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
            toast.error(t.identidadVisual.errNoProj);
            return;
        }
        if (!user) {
            toast.error(t.identidadVisual.errNoAuth);
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading(t.identidadVisual.guardandoId);

        try {
            const token = await getToken({ template: "supabase" });
            if (!token) throw new Error(t.identidadVisual.errToken);

            const supabaseAuth = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            try { await fetch('/api/init-bucket', { method: 'POST' }); } catch (e) { }

            let finalLogoUrl = logoUrl;

            if (logoFile) {
                const fileExt = logoFile.name.split(".").pop();
                const fileName = `${activeProjectId}/${Date.now()}_logo.${fileExt}`;
                const { error: uploadError } = await supabaseAuth.storage
                    .from("logos")
                    .upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error(`${t.identidadVisual.errSubirLogo}: ${uploadError.message}`);

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
                style_references: [],
            };

            const { error } = await supabaseAuth
                .from("brand_identity")
                .upsert(dataToSave, { onConflict: "project_id" });

            if (error) throw error;

            toast.success(t.identidadVisual.idGuardada, { id: toastId });
            router.push("/formato-creativo");
        } catch (error: any) {
            console.error("Error al guardar:", error);
            toast.error(error.message || t.identidadVisual.errGuardarId, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // Color swatches for quick palette selection
    const colorSwatches = [
        "#6366F1", "#8B5CF6", "#EC4899", "#EF4444", "#F59E0B",
        "#10B981", "#06B6D4", "#3B82F6", "#F97316", "#14B8A6",
    ];

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

            {/* Header */}
            <div className="p-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-400 font-medium mb-4">
                    <Palette className="w-3.5 h-3.5" />
                    {t.identidadVisual.badge}
                </div>
                <h1 className="text-4xl font-black tracking-tight mb-2">
                    Define tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-500">Marca</span>
                </h1>
                <p className="text-zinc-400 text-sm max-w-2xl">
                    {t.identidadVisual.desc}
                </p>
            </div>

            {/* ════════════════════════════════════════ */}
            {/* MAIN GRID — Dashboard-style layout      */}
            {/* ════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* ─── LEFT COLUMN: Info + Colors + Mockup ─── */}
                <div className="lg:col-span-5 space-y-5">

                    {/* BUSINESS INFO */}
                    <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                            <Sparkles className="w-4 h-4 text-fuchsia-400" />
                            INFORMACIÓN GENERAL
                        </div>
                        <div>
                            <Label className="text-[10px] font-bold text-zinc-500 tracking-wider mb-1 block">Nombre del Negocio</Label>
                            <div className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm">
                                {businessName}
                            </div>
                        </div>
                    </div>

                    {/* COLOR PALETTE */}
                    <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                            <Palette className="w-4 h-4 text-indigo-400" />
                            PALETA DE COLORES
                        </div>

                        {/* Quick Swatches */}
                        <div className="flex gap-2 flex-wrap">
                            {colorSwatches.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setPrimaryColor(c)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${primaryColor === c ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.3)] scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        {/* Primary Color */}
                        <div className="flex items-center gap-3 bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl border border-white/20 shadow-lg" style={{ backgroundColor: primaryColor }}>
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="absolute inset-[-5px] w-12 h-12 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-zinc-400 mb-0.5">Color Primario</div>
                                <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-7 bg-transparent border-none p-0 font-mono text-sm text-white focus-visible:ring-0"
                                />
                            </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="flex items-center gap-3 bg-zinc-900/50 rounded-xl p-3 border border-white/5">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl border border-white/20 shadow-lg" style={{ backgroundColor: secondaryColor }}>
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        className="absolute inset-[-5px] w-12 h-12 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-zinc-400 mb-0.5">Color Secundario</div>
                                <Input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="h-7 bg-transparent border-none p-0 font-mono text-sm text-white focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIVE MOCKUP PREVIEW */}
                    <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 tracking-wider">
                            <Eye className="w-3.5 h-3.5" />
                            PREVISUALIZACIÓN (MOCKUP)
                        </div>
                        <div
                            className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-700"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}dd, ${secondaryColor}cc)`,
                            }}
                        >
                            <div className="p-6 flex flex-col items-center text-center space-y-4 min-h-[200px] justify-center">
                                {logoPreview && (
                                    <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white/10 p-1.5 shadow-lg" />
                                )}
                                <div>
                                    <h3 className="text-white text-xl font-bold drop-shadow-lg" style={{ fontFamily: selectedFont }}>
                                        {slogan || `Transforma tu Negocio Hoy`}
                                    </h3>
                                    <p className="text-white/70 text-xs mt-1.5 max-w-[220px]" style={{ fontFamily: selectedFont }}>
                                        Descubre el método probado para escalar tus resultados.
                                    </p>
                                </div>
                                <button
                                    className="px-6 py-2 rounded-full text-sm font-bold shadow-xl transition-all"
                                    style={{
                                        backgroundColor: secondaryColor,
                                        color: '#fff',
                                    }}
                                >
                                    Ver Más Información
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: Logo + Slogan + Save ─── */}
                <div className="lg:col-span-7 space-y-5">

                    {/* LOGO + SLOGAN ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Logo Card */}
                        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-3 group hover:border-fuchsia-500/20 transition-all">
                            <div className="text-[10px] font-bold text-zinc-500 tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5 text-fuchsia-400" />
                                    LOGO
                                </span>
                                {logoPreview && (
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    </span>
                                )}
                            </div>
                            <div
                                className="relative aspect-square rounded-xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-fuchsia-500/30 transition-colors"
                                onClick={() => document.getElementById("logo-upload")?.click()}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4" />
                                ) : (
                                    <div className="text-center p-4">
                                        <UploadCloud className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                                        <span className="text-xs text-zinc-500">{t.identidadVisual.subeLogo}</span>
                                    </div>
                                )}
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-600 text-center">
                                PNG/JPG con fondo transparente preferiblemente
                            </p>
                        </div>

                        {/* Slogan Card */}
                        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-3 flex flex-col">
                            <div className="text-[10px] font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                SLOGAN / FRASE PRINCIPAL
                            </div>
                            <Textarea
                                value={slogan}
                                onChange={(e) => setSlogan(e.target.value)}
                                placeholder={t.identidadVisual.sloganPh}
                                className="bg-black/40 border-white/10 resize-none flex-1 min-h-[100px] focus-visible:ring-fuchsia-500 text-zinc-200 rounded-xl text-sm"
                            />
                            <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <Checkbox
                                    id="include-slogan"
                                    checked={includeSlogan}
                                    onCheckedChange={(checked) => setIncludeSlogan(checked as boolean)}
                                    className="data-[state=checked]:bg-fuchsia-500 data-[state=checked]:text-white border-white/20"
                                />
                                <Label htmlFor="include-slogan" className="text-xs text-zinc-400 cursor-pointer">
                                    {t.identidadVisual.mostrarSlogan}
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* TYPOGRAPHY SECTION */}
                    <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Type className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{t.identidadVisual.tipografiaTitle}</h3>
                                <p className="text-[10px] text-zinc-500">{t.identidadVisual.tipografiaDesc}</p>
                            </div>
                        </div>

                        <Select value={selectedFont} onValueChange={setSelectedFont}>
                            <SelectTrigger className="w-full bg-black/40 border-white/10 h-12 text-sm rounded-xl">
                                <SelectValue placeholder={t.identidadVisual.seleccionaFuente} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold">{t.identidadVisual.sansSerif}</SelectLabel>
                                    <SelectItem value="Inter">Inter</SelectItem>
                                    <SelectItem value="Roboto">Roboto</SelectItem>
                                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                                    <SelectItem value="Lato">Lato</SelectItem>
                                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                                    <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold mt-2">{t.identidadVisual.serif}</SelectLabel>
                                    <SelectItem value="PT Serif">PT Serif</SelectItem>
                                    <SelectItem value="Merriweather">Merriweather</SelectItem>
                                    <SelectItem value="Slabo 27px">Slabo 27px</SelectItem>
                                </SelectGroup>
                                <SelectGroup>
                                    <SelectLabel className="text-zinc-500 uppercase tracking-wider text-xs font-bold mt-2">{t.identidadVisual.display}</SelectLabel>
                                    <SelectItem value="Oswald">Oswald</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        {/* Font Preview */}
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <Input
                                    value={fontPreviewText}
                                    onChange={(e) => setFontPreviewText(e.target.value)}
                                    placeholder={t.identidadVisual.escribeAlgoProbar}
                                    className="bg-black/30 border-white/10 focus-visible:ring-violet-500 flex-1 text-sm"
                                />
                            </div>
                            <div className="p-6 bg-gradient-to-br from-white/[0.03] to-white/0 border border-white/5 rounded-xl text-center min-h-[90px] flex items-center justify-center">
                                <p className="text-2xl sm:text-3xl text-white tracking-tight break-words max-w-full" style={{ fontFamily: selectedFont }}>
                                    {fontPreviewText || t.identidadVisual.escribeAlgo}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-all px-8 py-6 rounded-full text-sm"
                        >
                            {isSaving ? (
                                t.identidadVisual.btnGuardando
                            ) : (
                                <><Save className="w-5 h-5 mr-2" /> {t.identidadVisual.btnConfirmar}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

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
