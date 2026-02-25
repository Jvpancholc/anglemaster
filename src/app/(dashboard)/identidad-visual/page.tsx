"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Palette, Type, Image as ImageIcon, UploadCloud } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Note: In a real app we would want validation for file type and size.
// Since inputs of type file are notoriously tricky with react-hook-form/zod, we are keeping it simple for now.
const formSchema = z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: "Debe ser un código hexadecimal válido (ej. #FFFFFF)",
    }),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: "Debe ser un código hexadecimal válido (ej. #000000)",
    }),
    typography: z.string().min(1, { message: "Selecciona una tipografía" }),
    // Logo is handled separately via state since file objects don't serialize well in typical setups
});

export default function IdentidadVisualPage() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            primaryColor: "#4f46e5", // Indigo-600 default
            secondaryColor: "#ec4899", // Pink-500 default
            typography: "inter", // Default font
        },
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create a preview URL for the selected image
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Add logo data to submission payload in reality
        const payload = {
            ...values,
            hasLogo: !!logoPreview,
        };
        console.log(payload);
        alert("¡Identidad visual guardada exitosamente!");
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identidad Visual</h1>
                <p className="text-muted-foreground mt-2">
                    Sube tus logos, paletas de colores y tipografías para mantener consistencia de marca.
                </p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Configuración de Marca</CardTitle>
                    <CardDescription>
                        Definir bien estos elementos asegura que los creativos generados sigan la misma línea visual.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Logo Section */}
                            <div className="space-y-4">
                                <FormLabel className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Logo Principal
                                </FormLabel>
                                <div className="flex items-start gap-6">
                                    {/* Preview Area */}
                                    <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                                        {logoPreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-4">
                                            <Button variant="outline" type="button" className="relative cursor-pointer">
                                                <UploadCloud className="mr-2 h-4 w-4" /> Subir Logo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleLogoUpload}
                                                />
                                            </Button>
                                            <span className="text-sm text-muted-foreground">Recomendado: Logo transparente en PNG o SVG.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="primaryColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Palette className="w-4 h-4" /> Color Principal
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex gap-3 items-center">
                                                    <Input
                                                        type="color"
                                                        className="p-1 h-10 w-16 cursor-pointer"
                                                        {...field}
                                                    />
                                                    <Input
                                                        type="text"
                                                        className="flex-1 font-mono uppercase"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                El color que más destaca en tu marca.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="secondaryColor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Palette className="w-4 h-4 text-muted-foreground" /> Color Secundario
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex gap-3 items-center">
                                                    <Input
                                                        type="color"
                                                        className="p-1 h-10 w-16 cursor-pointer"
                                                        {...field}
                                                    />
                                                    <Input
                                                        type="text"
                                                        className="flex-1 font-mono uppercase"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Color de acento o apoyo.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Typography Section */}
                            <FormField
                                control={form.control}
                                name="typography"
                                render={({ field }) => (
                                    <FormItem className="max-w-md">
                                        <FormLabel className="flex items-center gap-2">
                                            <Type className="w-4 h-4" /> Tipografía Principal
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una fuente" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="inter">Inter (Moderna y Limpia)</SelectItem>
                                                <SelectItem value="roboto">Roboto (Versátil e Institucional)</SelectItem>
                                                <SelectItem value="playfair">Playfair Display (Elegante y Clásica)</SelectItem>
                                                <SelectItem value="montserrat">Montserrat (Impactante y Geométrica)</SelectItem>
                                                <SelectItem value="poppins">Poppins (Amigable y Redondeada)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            La tipografía que se usará en los textos destacados de tus creativos.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
                                    Guardar Identidad Visual
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
