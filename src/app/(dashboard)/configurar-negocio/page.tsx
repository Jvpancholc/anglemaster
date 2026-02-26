"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Store, Link as LinkIcon, Target, AlignLeft, MousePointerClick, Plus, Upload, ArrowRight, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl || "https://mock.supabase.co", supabaseAnonKey || "mock-key");

export default function ConfigurarNegocioPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const [productPhotos, setProductPhotos] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { t } = useTranslation();

    const formSchema = z.object({
        businessName: z.string().min(2, { message: t.configurarNegocio.min2 }),
        shopifyUrl: z.string().url({ message: t.configurarNegocio.urlValida }).or(z.literal("")),
        niche: z.string().min(2, { message: t.configurarNegocio.requerido }),
        productDescription: z.string().min(10, { message: t.configurarNegocio.min10 }),
        mainCta: z.string().optional(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: "",
            shopifyUrl: "",
            niche: "",
            productDescription: "",
            mainCta: "",
        },
    });

    useEffect(() => {
        setMounted(true);
        if (!activeProjectId) {
            router.push("/");
            return;
        }

        const project = projects.find(p => p.id === activeProjectId);
        if (project) {
            form.reset({
                businessName: project.config.businessName || "",
                shopifyUrl: project.config.shopifyUrl || "",
                niche: project.config.niche || "",
                productDescription: project.config.description || "",
                mainCta: project.config.cta || "",
            });
            setProductPhotos(project.config.productPhotos || []);
        }
    }, [activeProjectId, projects, form, router]);

    const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeProjectId) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t.configurarNegocio.tamanoExc);
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(t.configurarNegocio.subiendoFoto);

        try {
            if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co") {
                const token = await getToken({ template: 'supabase' });

                if (!token) {
                    toast.error(t.configurarNegocio.errAuthClerk, { id: toastId });
                    setIsUploading(false);
                    return;
                }

                const supabaseAuth = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        global: { headers: { Authorization: `Bearer ${token}` } }
                    }
                );

                // Ensure bucket exists before upload (silently catch if error)
                try {
                    await fetch('/api/init-bucket', { method: 'POST' });
                } catch (e) { }

                const fileExt = file.name.split('.').pop();
                const fileName = `${activeProjectId}/${Date.now()}_photo_${index}.${fileExt}`;

                const { error } = await supabaseAuth.storage
                    .from('product-images')
                    .upload(fileName, file, { upsert: true, contentType: file.type });

                if (error) {
                    throw error;
                }

                const { data: publicUrlData } = supabaseAuth.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                const newUrl = publicUrlData.publicUrl;

                setProductPhotos(prev => {
                    const newPhotos = [...prev];
                    newPhotos[index] = newUrl;
                    return newPhotos;
                });
                toast.success(t.configurarNegocio.fotoSubida, { id: toastId });
            } else {
                // Mock local URL for demo
                const newUrl = URL.createObjectURL(file);
                setProductPhotos(prev => {
                    const newPhotos = [...prev];
                    newPhotos[index] = newUrl;
                    return newPhotos;
                });
                toast.success(t.configurarNegocio.fotoMock, { id: toastId });
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`${t.configurarNegocio.errSubir}: ${error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
            e.target.value = ""; // reset input
        }
    };

    const handleRemovePhoto = (index: number) => {
        setProductPhotos(prev => {
            const newPhotos = [...prev];
            delete newPhotos[index]; // remove but preserve indices
            return newPhotos;
        });
    }

    const renderPhotoSlot = (index: number, label: string) => {
        const photoUrl = productPhotos[index];
        return (
            <div key={index} className="relative border border-dashed border-white/20 rounded-xl bg-white/5 flex flex-col items-center justify-center min-h-[140px] aspect-square overflow-hidden hover:bg-white/10 transition group">
                {photoUrl ? (
                    <>
                        <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => { e.preventDefault(); handleRemovePhoto(index); }}
                                className="h-8 rounded-full px-3"
                            >
                                <X className="w-4 h-4 mr-1" /> {t.configurarNegocio.quitar}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handlePhotoUpload(index, e)}
                            disabled={isUploading}
                        />
                        {index === 0 ? <Upload className="w-6 h-6 text-zinc-400 mb-2 group-hover:scale-110 transition-transform" /> : <Plus className="w-6 h-6 text-zinc-400 mb-2 group-hover:scale-110 transition-transform" />}
                        <span className="text-sm font-medium text-zinc-300">{label}</span>
                        <span className="text-xs text-zinc-500">{index === 0 ? t.configurarNegocio.subir : t.configurarNegocio.anadir}</span>
                    </>
                )}
            </div>
        );
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProjectId) return;
        setIsSaving(true);

        try {
            updateProject(activeProjectId, {
                name: values.businessName, // keep the project item title synched
                config: {
                    businessName: values.businessName,
                    shopifyUrl: values.shopifyUrl,
                    niche: values.niche,
                    cta: values.mainCta || "",
                    description: values.productDescription,
                    productPhotos: productPhotos,
                },
                identity: {
                    primaryColor: '#6366f1',
                    secondaryColor: '#a855f7',
                    // retrieve existing and merge
                    ...projects.find(p => p.id === activeProjectId)?.identity,
                    typography: projects.find(p => p.id === activeProjectId)?.identity?.typography || 'Inter'
                }
            });

            if (supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://mock.supabase.co") {
                const token = await getToken({ template: 'supabase' });

                if (!token) {
                    toast.error(t.configurarNegocio.errAuth);
                    setIsSaving(false);
                    return;
                }

                const supabaseAuth = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        global: { headers: { Authorization: `Bearer ${token}` } }
                    }
                );

                // Limpiar undefined/nulls en array para evitar errores JSON
                const cleanPhotos = productPhotos.filter(Boolean);

                const { error: dbError } = await supabaseAuth
                    .from('business_config')
                    .upsert({
                        project_id: activeProjectId,
                        user_id: user?.id,
                        business_name: values.businessName,
                        shopify_url: values.shopifyUrl,
                        niche: values.niche,
                        description: values.productDescription,
                        cta: values.mainCta || "",
                        product_photos: cleanPhotos
                    }, { onConflict: 'project_id' });

                if (dbError) {
                    console.error("No se pudo insertar en la tabla business_config:", dbError);
                    toast.error(`${t.configurarNegocio.errGuardarBD}: ${dbError.message}`);
                    setIsSaving(false);
                    return; // Stop execution to prevent success message
                }
            }

            toast.success(t.configurarNegocio.infoGuardada);
            router.push("/identidad-visual");
        } catch (error) {
            console.error("Error saving config:", error);
            toast.error(t.configurarNegocio.errGuardarConf);
        } finally {
            setIsSaving(false);
        }
    }

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.configurarNegocio.title}</h1>
                <p className="text-muted-foreground mt-2">
                    {t.configurarNegocio.subtitle}
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative">
                <CardHeader>
                    <CardTitle>{t.configurarNegocio.infoGenTitle}</CardTitle>
                    <CardDescription>{t.configurarNegocio.infoGenDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-violet-400" /> {t.configurarNegocio.nombreNegocioLabel}
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-violet-500" placeholder={t.configurarNegocio.nombreNegocioPh} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shopifyUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-fuchsia-400" /> {t.configurarNegocio.shopifyUrlLabel}
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500" placeholder={t.configurarNegocio.shopifyUrlPh} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="niche"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-sky-400" /> {t.configurarNegocio.nichoLabel}
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-sky-500" placeholder={t.configurarNegocio.nichoPh} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mainCta"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <MousePointerClick className="w-4 h-4 text-emerald-400" /> {t.configurarNegocio.ctaLabel} <span className="text-muted-foreground font-normal">{t.configurarNegocio.opcional}</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-emerald-500" placeholder={t.configurarNegocio.ctaPh} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="productDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4 text-orange-400" /> {t.configurarNegocio.descLabel}
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t.configurarNegocio.descPh}
                                                className="resize-none h-32 bg-white/5 border-white/10 focus-visible:ring-orange-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {t.configurarNegocio.descHint}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Identidad Visual Color Selection removed as requested */}

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-zinc-200">
                                    <span className="text-blue-500">📸</span> {t.configurarNegocio.fotosTitle}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {renderPhotoSlot(0, t.configurarNegocio.fotoPrinc)}
                                    {renderPhotoSlot(1, t.configurarNegocio.fotoDet1)}
                                    {renderPhotoSlot(2, t.configurarNegocio.fotoDet2)}
                                    {renderPhotoSlot(3, t.configurarNegocio.fotoDet3)}
                                </div>
                                <p className="text-xs text-zinc-500 mt-3">
                                    {t.configurarNegocio.fotosHint}
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving || isUploading}
                                    className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all px-8 py-6 rounded-full text-base border-0"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {t.configurarNegocio.btnGuardando}</span>
                                    ) : (
                                        <span className="flex items-center gap-2">{t.configurarNegocio.btnGuardarContinuar} <ArrowRight className="w-5 h-5 mt-0.5" /></span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
