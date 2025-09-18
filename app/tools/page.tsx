import ToolCard from '../../components/ToolCard';

export default function ToolsIndex() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Herramientas</h1>
      <div className="grid md:grid-cols-3 gap-5">
        <ToolCard href="/tools/pdf" title="PDF: unir / dividir" desc="Procesado local con privacidad." />
        <ToolCard href="/tools/resumen" title="Resumir texto (IA)" desc="Ideas clave en segundos." />
        <ToolCard href="/tools/mejora" title="Mejorar redacción (IA)" desc="Claro, correcto y con buen tono." />
      </div>
    </div>
  );
}
