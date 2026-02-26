-- Instrucciones SQL para ejecutar en el Editor SQL de Supabase
-- Copia y pega esto en tu dashboard de Supabase -> SQL Editor -> New Query

-- 1. Asegurarnos de que las columnas correctas existen
ALTER TABLE brand_identity ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE brand_identity ADD COLUMN IF NOT EXISTS include_slogan BOOLEAN DEFAULT false;

-- 2. Eliminar cualquier política anterior que pueda estar causando conflictos
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON brand_identity;
DROP POLICY IF EXISTS "Enable update for users based on email" ON brand_identity;
DROP POLICY IF EXISTS "Usuarios pueden insertar su identidad visual" ON brand_identity;
DROP POLICY IF EXISTS "Usuarios pueden modificar su identidad visual" ON brand_identity;

-- 3. Habilitar la seguridad a nivel de filas (si no estaba habilitada)
ALTER TABLE brand_identity ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas MÁS SIMPLES y directas apuntando al user_id de Clerk
CREATE POLICY "Permitir insertar a dueños" ON brand_identity
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Permitir actualizar a dueños" ON brand_identity
    FOR UPDATE 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Permitir ver a dueños" ON brand_identity
    FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Permitir borrar a dueños" ON brand_identity
    FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Opcional para asegurar que Service Role (tu backend) tenga control total:
CREATE POLICY "Service Role Full Access" ON brand_identity
    FOR ALL
    USING (true)
    WITH CHECK (true);
