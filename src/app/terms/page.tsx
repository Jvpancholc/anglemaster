import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">AngleMaster</span>
                </Link>
                <Link href="/">
                    <Button variant="outline" className="bg-white/5 border-white/10 text-white rounded-full px-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                </Link>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16 prose prose-invert prose-lg">
                <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    Términos de Servicio y Política de Privacidad
                </h1>
                <p className="text-zinc-400 text-sm mb-12">Última actualización: Febrero 2026</p>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">1. Aceptación de términos</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        Al utilizar AngleMaster, aceptas estos términos de servicio. Si no estás de acuerdo con alguno de ellos, no utilices la plataforma.
                    </p>

                    <h2 className="text-2xl font-bold text-white">2. Descripción del servicio</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        AngleMaster es una herramienta de generación de creativos publicitarios asistida por inteligencia artificial.
                        El servicio permite configurar identidades de marca, generar ángulos de venta y producir imágenes creativas para anuncios.
                    </p>

                    <h2 className="text-2xl font-bold text-white">3. Claves API (Bring Your Own Key)</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        AngleMaster opera bajo un modelo BYOK (Bring Your Own Key). El usuario es responsable de:
                    </p>
                    <ul className="text-zinc-300 space-y-2">
                        <li>Obtener y mantener su clave API de Google Gemini.</li>
                        <li>Cumplir con los términos de servicio de cada proveedor de IA.</li>
                        <li>Los costos asociados al uso de las APIs de terceros.</li>
                        <li>La seguridad de sus claves API. AngleMaster almacena las claves de forma segura pero no se responsabiliza por usos no autorizados.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white">4. Almacenamiento y retención de datos</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        <strong>Imágenes generadas:</strong> Las imágenes creativas se almacenan temporalmente y se eliminan automáticamente después de <strong>3 días</strong>.
                        Es responsabilidad del usuario descargar las imágenes que desee conservar antes de su eliminación.
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                        <strong>Datos del proyecto:</strong> La configuración de marca, ángulos de venta y análisis se conservan mientras el usuario mantenga su cuenta activa.
                    </p>

                    <h2 className="text-2xl font-bold text-white">5. Privacidad y protección de datos</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        Recopilamos únicamente la información necesaria para el funcionamiento del servicio:
                    </p>
                    <ul className="text-zinc-300 space-y-2">
                        <li>Información de autenticación (proporcionada a través de Clerk).</li>
                        <li>Configuraciones de proyecto y marca.</li>
                        <li>Claves API encriptadas.</li>
                        <li>Imágenes generadas (retenidas máximo 3 días).</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-white">6. Derecho al olvido (GDPR)</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        Tienes derecho a solicitar la eliminación completa de todos tus datos. Puedes hacerlo desde la configuración de tu cuenta
                        o contactándonos directamente. Al eliminar tu cuenta, se borrarán permanentemente todos tus proyectos, configuraciones,
                        claves API almacenadas e imágenes generadas.
                    </p>

                    <h2 className="text-2xl font-bold text-white">7. Limitación de responsabilidad</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        AngleMaster se proporciona &quot;tal cual&quot;. No garantizamos la disponibilidad ininterrumpida del servicio ni la calidad
                        de los resultados generados por la IA. El usuario es responsable del uso que haga de los creativos generados y debe
                        asegurar que no infrinjan derechos de terceros.
                    </p>

                    <h2 className="text-2xl font-bold text-white">8. Contacto</h2>
                    <p className="text-zinc-300 leading-relaxed">
                        Para consultas sobre estos términos, escríbenos a: <span className="text-fuchsia-400">soporte@anglemaster.com</span>
                    </p>
                </section>
            </main>

            <footer className="border-t border-white/5 py-8 text-center text-zinc-600 text-sm">
                &copy; {new Date().getFullYear()} AngleMaster. Todos los derechos reservados.
            </footer>
        </div>
    );
}
