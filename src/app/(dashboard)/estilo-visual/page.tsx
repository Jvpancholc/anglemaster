export default function EstiloVisualPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Estilo Visual</h1>
                <p className="text-muted-foreground mt-2">
                    Selecciona el estilo artístico de las imágenes que la IA generará para tus anuncios.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow h-64 flex items-center justify-center p-6 border-dashed">
                    <p className="text-muted-foreground">Opciones de Estilo</p>
                </div>
            </div>
        </div>
    );
}
