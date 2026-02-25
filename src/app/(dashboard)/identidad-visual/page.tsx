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
        <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Identidad Visual</h1>
                <p className="text-muted-foreground mt-2">
                    Sube tus logos, paletas de colores y tipografías para mantener consistencia de marca.
                </p>
            </div>

            <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 pointer-events-none" />
                <CardHeader className="relative z-10">
                    <CardTitle>Configuración de Marca</CardTitle>
                    <CardDescription>
                        Definir bien estos elementos asegura que los creativos generados sigan la misma línea visual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Logo Section */}
                            <div className="space-y-4">
                                <FormLabel className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-pink-400" /> Logo Principal
                                </FormLabel>
                                <div className="flex items-start gap-6">
                                    {/* Preview Area */}
                                    <div className="h-32 w-32 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden shrink-0 transition-all hover:bg-white/10 hover:border-pink-500/50 relative group">
                                        {logoPreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-white/20 group-hover:text-pink-400/50 transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>

                                    {/* Upload Controls */}
                                    <div className="space-y-3 flex-1">
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" type="button" className="relative cursor-pointer w-fit bg-white/5 border-white/10 hover:bg-white/10 hover:text-white">
                                                <UploadCloud className="mr-2 h-4 w-4 text-pink-400" /> Subir Logo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleLogoUpload}
                                                />
                                            </Button>
                                            <span className="text-sm text-muted-foreground">Recomendado: Logo transparente en PNG o SVG. Max 5MB.</span>
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
                                                <Palette className="w-4 h-4 text-violet-400" /> Color Principal
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex gap-3 items-center">
                                                    <div className="relative rounded-md overflow-hidden h-10 w-16 border border-white/10 shrink-0">
                                                        <input
                                                            type="color"
                                                            className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer"
                                                            {...field}
                                                        />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        className="flex-1 font-mono uppercase bg-white/5 border-white/10 focus-visible:ring-violet-500"
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
                                                <Palette className="w-4 h-4 text-fuchsia-400" /> Color Secundario
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex gap-3 items-center">
                                                    <div className="relative rounded-md overflow-hidden h-10 w-16 border border-white/10 shrink-0">
                                                        <input
                                                            type="color"
                                                            className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer"
                                                            {...field}
                                                        />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        className="flex-1 font-mono uppercase bg-white/5 border-white/10 focus-visible:ring-fuchsia-500"
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
                                            <Type className="w-4 h-4 text-sky-400" /> Tipografía Principal
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-white/5 border-white/10 focus:ring-sky-500">
                                                    <SelectValue placeholder="Selecciona una fuente" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-950 border-white/10">
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
                                <Button type="submit" className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all duration-300">
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
