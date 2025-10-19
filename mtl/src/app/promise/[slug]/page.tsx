import Link from "next/link";
import { notFound } from "next/navigation";
import promisesData from "@/data/promises.json";
import { getSource, getText, Language } from "@/lib/content";

const DEFAULT_LANGUAGE: Language = "en";

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
  const promise = promisesData.find((item) => item.id === slug);

  if (!promise) {
    notFound();
  }

  const language = DEFAULT_LANGUAGE;
  const titleKey = `promise__${promise.id}__title`;
  const title = getText(titleKey, language);
  const partyLabel = getText(promise.party, language);
  const categoryLabels = promise.category.map((category) =>
    getText(category, language)
  );
  const demographicLabels = promise.demographic.map((demographic) =>
    getText(demographic, language)
  );
  const landLabels = promise.land.map((land) => getText(land, language));
  const details = promise.details.map((detailKey) => getText(detailKey, language));
  const sources = promise.sources.map((sourceKey) => getSource(sourceKey, language));

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between text-sm font-medium text-[#5a5a5a]">
        <Link
          href="/"
          className="rounded px-2 py-1 text-[#111111] transition-colors hover:bg-[#e1e1e1]"
        >
          ← Back
        </Link>
        <span>Promise Detail</span>
      </header>

      <article className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#4c4c4c]">Party</p>
          <p className="text-xl text-[#111111]">{partyLabel}</p>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-[#111111]">{title}</h1>
          <div className="flex flex-wrap gap-2 text-sm font-medium text-[#5a5a5a]">
            {categoryLabels.map((label) => (
              <span key={label} className="rounded-full bg-[#dedede] px-3 py-1 text-[#1f1f1f]">
                {label}
              </span>
            ))}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#4c4c4c]">
            Who it speaks to
          </h2>
          <div className="flex flex-wrap gap-2 text-sm text-[#1f1f1f]">
            {demographicLabels.map((label) => (
              <span key={label} className="rounded border border-[#d4d4d4] px-3 py-1">
                {label}
              </span>
            ))}
          </div>
          {landLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm font-medium text-[#5a5a5a]">
              {landLabels.map((label) => (
                <span key={label} className="rounded bg-[#ebebeb] px-2 py-1 text-[#2c2c2c]">
                  {label}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#4c4c4c]">Details</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm font-medium leading-relaxed">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#4c4c4c]">Sources</h2>
          {sources.length === 0 ? (
            <p className="text-sm text-[#9b9b9b]">No source listed for this promise.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sources.map((source) => (
                <li key={`${promise.id}-${source.label}`}>
                  Found in {" "}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#111111] underline decoration-dotted underline-offset-4 hover:opacity-80"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
