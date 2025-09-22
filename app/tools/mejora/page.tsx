import ToolAIClient from '../../../components/ToolAIClient';

export default function Page() {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Mejorar texto (IA)</h1>
      <ToolAIClient mode="mejora" allowTone />
    </div>
  );
}
