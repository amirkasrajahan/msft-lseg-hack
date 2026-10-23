import { HorizonOptions } from '@/components/flow/HorizonOptions';

/** Standalone view of the same three options, for linking to a single session. */
export default async function OptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="shell">
      <HorizonOptions sessionId={id} />
    </main>
  );
}
