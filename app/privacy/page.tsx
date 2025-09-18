export const metadata = { title: 'Privacidad' };

export default function PrivacyPage() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Política de Privacidad</h1>
      <p><strong>openSwiss</strong> trata datos mínimos para operar la web y sus herramientas.</p>

      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Datos técnicos (IP, navegador) para seguridad y estadísticas agregadas.</li>
        <li>Contenido que procesas en herramientas (p. ej., texto para resumir) — se procesa con fines funcionales.</li>
      </ul>

      <h2>Base legal</h2>
      <p>Interés legítimo para operar el servicio; consentimiento para analítica/marketing.</p>

      <h2>Proveedores</h2>
      <ul>
        <li>Hosting y despliegue (p. ej., Vercel).</li>
        <li>Procesamiento de IA (OpenAI) cuando usas funciones de IA.</li>
        <li>Analítica (solo si consientes) — Plausible, sin cookies identificables.</li>
      </ul>

      <h2>Conservación</h2>
      <p>No almacenamos tus documentos por defecto. El procesamiento de PDF ocurre en tu navegador.</p>

      <h2>Tus derechos</h2>
      <p>Acceso, rectificación, supresión, oposición y portabilidad. Escríbenos a soporte@openswiss.test.</p>

      <h2>Cookies</h2>
      <p>Mostramos un banner para aceptar o rechazar analítica. Sin consentimiento, no se carga.</p>

      <h2>Contacto</h2>
      <p>Responsable: openSwiss · Email: soporte@openswiss.test</p>
      <p>Fecha: {new Date().toISOString().slice(0,10)}</p>
    </div>
  );
}
