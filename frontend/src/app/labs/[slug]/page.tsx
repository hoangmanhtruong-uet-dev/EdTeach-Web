import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLab, LABS } from "@/data/labs";
import { LabViewer } from "./lab-viewer";

export function generateStaticParams() {
  return LABS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return {};
  return {
    title: `${lab.titleVi} — Phòng thí nghiệm 3D | EduTest`,
    description: lab.questionVi ?? `Thí nghiệm 3D tương tác: ${lab.titleVi}`,
  };
}

async function LabContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  const lab = getLab(slug);
  if (!lab) notFound();

  return <LabViewer lab={lab} />;
}

export default function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center bg-slate-950 text-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-slate-400">Đang khởi tạo phòng thí nghiệm 3D...</p>
            </div>
          </div>
        }
      >
        <LabContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
