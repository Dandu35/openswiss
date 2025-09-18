import Link from 'next/link';

export default function Page() {
  return (
    <div className="space-y-10">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3">
          <img src="/logo.svg" alt="openSwiss" className="h-10" />
          <span className="text-2xl font-semibold">openSwiss</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold">Tu navaja suiza digital</h1>
        <p className="text-neutral-300 max-w-2xl mx-auto">
          Edita PDFs, resume y mejora tus textos con IA — todo en un solo lugar, gratis para empezar.
        </p>
        <div className="flex gap-3 justify-center">
        <Link href="/tools"className="btn"onClick={() => (window as any).plausible?.('CTA Tools')}>Probar herramientas</Link>          <a href="#precios" className="btn bg-neutral-800 hover:bg-neutral-700">Ver precios</a>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-5">
        <Feature title="Unir/Dividir PDF" desc="Procesa PDFs en tu navegador, sin subirlos al servidor." />
        <Feature title="Resúmenes con IA" desc="Obtén ideas clave en segundos, en español o el idioma que elijas." />
        <Feature title="Mejora de redacción" desc="Corrige tono, gramática y claridad con un clic." />
      </section>

      <section id="precios" className="space-y-4">
        <h2 className="text-2xl font-bold">Precios</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Gratis</h3>
            <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
              <li>PDF unir/dividir (básico)</li>
              <li>Resúmenes cortos</li>
              <li>Mejora de texto (1.000 palabras/día)</li>
            </ul>
          </div>
          <div className="card border-brand">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-3xl font-extrabold mb-2">5€<span className="text-base font-medium">/mes</span></p>
            <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
              <li>IA ampliada y rápida</li>
              <li>Resúmenes largos</li>
              <li>Exportar a DOCX/Markdown</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Equipos</h3>
            <p className="text-sm text-neutral-300">Bajo demanda para centros educativos.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-neutral-300 text-sm">{desc}</p>
    </div>
  );
}
