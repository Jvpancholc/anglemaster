"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Store, Link as LinkIcon, Target, AlignLeft, MousePointerClick } from "lucide-react";

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
    businessName: z.string().min(2, {
        message: "El nombre del negocio debe tener al menos 2 caracteres.",
    }),
    shopifyUrl: z.string().url({
        message: "Por favor, ingresa una URL válida (ej. https://mitienda.myshopify.com).",
    }),
    niche: z.string().min(2, {
        message: "Por favor, especifica el nicho de tu negocio.",
    }),
    productDescription: z.string().min(10, {
        message: "La descripción debe tener al menos 10 caracteres.",
    }),
    mainCta: z.string().optional(),
});

export default function ConfigurarNegocioPage() {
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

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Aquí iría la lógica para guardar en la base de datos (Supabase)
        console.log(values);
        alert("¡Configuración guardada exitosamente!");
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurar Negocio</h1>
                <p className="text-muted-foreground mt-2">
                    Define la información principal de tu tienda Shopify y el producto que vas a vender.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />
                <CardHeader className="relative z-10">
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>
                        Estos datos ayudarán a la IA a entender mejor tu marca y tus productos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <FormDescription>
                                                El llamado a la acción que más usas.
                                            </FormDescription>
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

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all duration-300">
                                    Guardar Configuración
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
