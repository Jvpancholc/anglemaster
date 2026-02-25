export default function FormatoCreativoPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Formato Creativo</h1>
                <p className="text-muted-foreground mt-2">
                    Elige si quieres crear imágenes estáticas, carruseles o guiones para video.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow h-64 flex items-center justify-center p-6 border-dashed">
                    <p className="text-muted-foreground">Selección de Formatos</p>
                </div>
            </div>
        </div>
    );
}
