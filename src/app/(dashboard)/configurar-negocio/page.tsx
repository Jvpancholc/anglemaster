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
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurar Negocio</h1>
                <p className="text-muted-foreground mt-2">
                    Define la información principal de tu tienda Shopify y el producto que vas a vender.
                </p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                    <CardDescription>
                        Estos datos ayudarán a la IA a entender mejor tu marca y tus productos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Store className="w-4 h-4" /> Nombre del Negocio
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. AngleMaster Store" {...field} />
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
                                                <LinkIcon className="w-4 h-4" /> URL de Shopify
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://mitienda.myshopify.com" {...field} />
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
                                                <Target className="w-4 h-4" /> Nicho o Categoría
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Ropa deportiva, Tecnología, Salud..." {...field} />
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
                                                <MousePointerClick className="w-4 h-4" /> CTA Principal (Opcional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Compra ahora, Descubre más" {...field} />
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
                                            <AlignLeft className="w-4 h-4" /> Descripción del Producto o Servicio
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe qué vendes, cuáles son sus beneficios principales y qué problema resuelve para tu cliente ideal."
                                                className="resize-none h-32"
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
                                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
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
