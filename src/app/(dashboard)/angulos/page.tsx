export default function AngulosPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ángulos Seleccionados</h1>
                <p className="text-muted-foreground mt-2">
                    Revisa y aprueba los ángulos de venta propuestos por la IA antes de la generación.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow h-64 flex items-center justify-center p-6 border-dashed">
                    <p className="text-muted-foreground">Lista de Ángulos</p>
                </div>
            </div>
        </div>
    );
}
