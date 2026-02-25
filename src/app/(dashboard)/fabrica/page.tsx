export default function FabricaPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">La Fábrica</h1>
                <p className="text-muted-foreground mt-2">
                    Aquí ocurre la magia. Mira cómo la IA genera todos tus creativos basándose en las configuraciones previas.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow h-64 flex items-center justify-center p-6 border-dashed">
                    <p className="text-muted-foreground">Progreso de Generación</p>
                </div>
            </div>
        </div>
    );
}
