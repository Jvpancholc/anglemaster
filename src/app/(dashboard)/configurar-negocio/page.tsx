"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Store, Link as LinkIcon, Target, AlignLeft, MousePointerClick, Plus, Upload, ArrowRight } from "lucide-react";
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

const formSchema = z.object({
    businessName: z.string().min(2, { message: "Mínimo 2 caracteres." }),
    shopifyUrl: z.string().url({ message: "URL válida requerida." }).or(z.literal("")),
    niche: z.string().min(2, { message: "Requerido." }),
    productDescription: z.string().min(10, { message: "Mínimo 10 caracteres." }),
    mainCta: z.string().optional(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
});

export default function ConfigurarNegocioPage() {
    const router = useRouter();
    const { activeProjectId, projects, updateProject } = useProjectStore();
    const [mounted, setMounted] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            businessName: "",
            shopifyUrl: "",
            niche: "",
            productDescription: "",
            mainCta: "",
            primaryColor: "#6366f1",
            secondaryColor: "#a855f7",
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
                primaryColor: project.identity.primaryColor || "#6366f1",
                secondaryColor: project.identity.secondaryColor || "#a855f7",
            });
        }
    }, [activeProjectId, projects, form, router]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!activeProjectId) return;

        updateProject(activeProjectId, {
            name: values.businessName, // keep the project item title synched
            config: {
                businessName: values.businessName,
                shopifyUrl: values.shopifyUrl,
                niche: values.niche,
                cta: values.mainCta || "",
                description: values.productDescription,
            },
            identity: {
                // retrieve existing and merge
                ...projects.find(p => p.id === activeProjectId)?.identity,
                primaryColor: values.primaryColor,
                secondaryColor: values.secondaryColor,
                typography: 'Inter' // default
            }
        });

        toast.success("Información guardada exitosamente");
        router.push("/identidad-visual");
    }

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurar Negocio</h1>
                <p className="text-muted-foreground mt-2">
                    Define la información principal de tu tienda y el producto que vas a vender.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative">
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>Estos datos ayudarán a la IA a entender mejor tu marca y tus productos.</CardDescription>
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
                                                <Store className="w-4 h-4 text-violet-400" /> Nombre del Negocio
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-violet-500" placeholder="Ej. AngleMaster Store" {...field} />
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
                                                <LinkIcon className="w-4 h-4 text-fuchsia-400" /> URL de Shopify
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-fuchsia-500" placeholder="https://mitienda.myshopify.com" {...field} />
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
                                                <Target className="w-4 h-4 text-sky-400" /> Nicho o Categoría
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-sky-500" placeholder="Ej. Ropa deportiva, Tecnología, Salud..." {...field} />
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
                                                <MousePointerClick className="w-4 h-4 text-emerald-400" /> CTA Principal <span className="text-muted-foreground font-normal">(Opcional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="bg-white/5 border-white/10 focus-visible:ring-emerald-500" placeholder="Ej. Compra ahora, Descubre más" {...field} />
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
                                            <AlignLeft className="w-4 h-4 text-orange-400" /> Descripción del Producto o Servicio
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe qué vendes, cuáles son sus beneficios principales y qué problema resuelve para tu cliente ideal."
                                                className="resize-none h-32 bg-white/5 border-white/10 focus-visible:ring-orange-500"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Sé lo más detallado posible. La IA usará esto para generar los ángulos.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Secciones Adicionales Solicitadas */}
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-zinc-200">
                                    <span className="text-pink-500">🎨</span> Paleta de Colores
                                </h3>
                                <div className="flex gap-6">
                                    <FormField
                                        control={form.control}
                                        name="primaryColor"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-4 space-y-0">
                                                <div className="flex flex-col">
                                                    <FormLabel>Color Primario</FormLabel>
                                                    <FormDescription className="text-xs">Predominante</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <input type="color" className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="secondaryColor"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-4 space-y-0">
                                                <div className="flex flex-col">
                                                    <FormLabel>Color Secundario</FormLabel>
                                                    <FormDescription className="text-xs">Acentos</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <input type="color" className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-zinc-200">
                                    <span className="text-blue-500">📸</span> Fotos de Producto
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="border border-dashed border-white/20 rounded-xl bg-white/5 p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:bg-white/10 transition">
                                        <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                                        <span className="text-sm font-medium text-zinc-300">Principal</span>
                                        <span className="text-xs text-zinc-500">Subir</span>
                                    </div>
                                    <div className="border border-dashed border-white/20 rounded-xl bg-white/5 p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:bg-white/10 transition">
                                        <Plus className="w-6 h-6 text-zinc-400 mb-2" />
                                        <span className="text-sm font-medium text-zinc-300">Detalle</span>
                                        <span className="text-xs text-zinc-500">Añadir</span>
                                    </div>
                                    <div className="border border-dashed border-white/20 rounded-xl bg-white/5 p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:bg-white/10 transition">
                                        <Plus className="w-6 h-6 text-zinc-400 mb-2" />
                                        <span className="text-sm font-medium text-zinc-300">Detalle</span>
                                        <span className="text-xs text-zinc-500">Añadir</span>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-3">
                                    Sube la foto principal aquí. La IA la usará como referencia.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white font-semibold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all px-8 py-5 rounded-full">
                                    Guardar Marca y Continuar <ArrowRight className="w-4 h-4 mt-0.5 ml-2" />
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
