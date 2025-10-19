import { notFound } from "next/navigation";
import promisesData from "@/data/promises.json";
import { PromiseDetailClient, type PromiseEntry } from "./PromiseDetailClient";

export function generateStaticParams() {
  return promisesData.map((promise) => ({ slug: promise.id }));
}

type PromiseDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PromiseDetailPage({
  params,
}: PromiseDetailPageProps) {
  const { slug } = await params;
  const promise = promisesData.find((item) => item.id === slug) as PromiseEntry | undefined;

  if (!promise) {
    notFound();
  }
  return <PromiseDetailClient promise={promise} />;
}
