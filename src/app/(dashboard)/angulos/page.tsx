import { Target, Zap, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AngulosPage() {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-red-500" />
                        Ángulos de Marketing
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Define los diferentes "hooks" o enfoques para vender tu producto.
                    </p>
                </div>
                <Button className="bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Ángulo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center justify-between">
                            El Problema Urgente
                        </CardTitle>
                        <CardDescription>
                            Enfocado en el dolor inmediato del cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-zinc-400 text-sm mb-4">
                            "¿Cansado de perder tiempo limpiando? Descubre cómo este dispositivo lo hace por ti mientras duermes."
                        </p>
                        <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white">
                            Usar en Creativos
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl relative overflow-hidden border-dashed">
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[220px] text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <Zap className="w-8 h-8 mb-4 text-red-400 opacity-50" />
                        <p className="font-medium">Generar Ángulos con IA</p>
                        <p className="text-sm mt-1 text-center max-w-[250px]">
                            La IA usará la configuración de tu negocio para crear ideas ganadoras.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
