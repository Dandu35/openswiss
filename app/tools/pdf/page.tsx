'use client';

import { PDFDocument } from 'pdf-lib';
import { useState } from 'react';

export default function PdfTool() {
  const [mergeFiles, setMergeFiles] = useState<FileList | null>(null);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [range, setRange] = useState('1-');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMerge() {
    if (!mergeFiles || mergeFiles.length === 0) return;
    setBusy(true); setError(null);
    try {
      const outPdf = await PDFDocument.create();
      for (const f of Array.from(mergeFiles)) {
        const bytes = await f.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const pages = await outPdf.copyPages(src, src.getPageIndices());
        pages.forEach(p => outPdf.addPage(p));
      }
      const outBytes = await outPdf.save();
      downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'merged.pdf');
    } catch (e: any) {
      setError('No se pudo unir el PDF: ' + e?.message);
    } finally { setBusy(false); }
  }

  async function handleSplit() {
    if (!splitFile) return;
    setBusy(true); setError(null);
    try {
      const bytes = await splitFile.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();

      const [startStr, endStr] = range.split('-');
      const start = Math.max(1, parseInt(startStr || '1', 10));
      const end = endStr ? Math.min(parseInt(endStr, 10), total) : total;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end) throw new Error('Rango inválido. Usa formato 1-3, 2-, -5');

      const out = await PDFDocument.create();
      const pages = await out.copyPages(doc, Array.from({ length: end - start + 1 }, (_, i) => i + (start - 1)));
      pages.forEach(p => out.addPage(p));
      const outBytes = await out.save();
      downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), `split_${start}-${end}.pdf`);
    } catch (e: any) {
      setError('No se pudo dividir el PDF: ' + e?.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">PDF: unir / dividir</h1>
      <p className="text-neutral-300 text-sm">Todo el procesamiento ocurre en tu navegador para mayor privacidad.</p>

      <section className="card space-y-3">
        <h2 className="font-semibold">Unir PDFs</h2>
        <input className="block w-full text-sm" type="file" multiple accept="application/pdf" onChange={e => setMergeFiles(e.target.files)} />
        <button className="btn" onClick={handleMerge} disabled={busy}>Unir</button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Dividir PDF por rango</h2>
        <input className="block w-full text-sm" type="file" accept="application/pdf" onChange={e => setSplitFile(e.target.files?.[0] || null)} />
        <div className="flex gap-2 items-center">
          <label className="text-sm text-neutral-400">Rango:</label>
          <input className="input" placeholder="1-3, 2-, -5" value={range} onChange={e => setRange(e.target.value)} />
          <button className="btn" onClick={handleSplit} disabled={busy}>Dividir</button>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </section>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
