import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Dar Elegance | من نحن" },
      {
        name: "description",
        content:
          "Dar Elegance, marque marocaine de prêt-à-porter : matières choisies, coupes modernes et livraison partout au Maroc.",
      },
      { property: "og:title", content: "À propos — Dar Elegance" },
      { property: "og:description", content: "Notre histoire, nos valeurs, notre savoir-faire marocain." },
    ],
  }),
  component: About,
});

function About() {
  const { t, lang } = useI18n();
  const body =
    lang === "ar"
      ? [
          "وُلدت دار الأناقة في الدار البيضاء من فكرة بسيطة: ملابس عصرية بجودة عالية وأسعار عادلة، مصممة للحياة اليومية في المغرب.",
          "نختار خاماتنا بعناية ونعمل مع ورشات محلية لضمان جودة كل قطعة، من الخياطة إلى التغليف.",
          "نوصل إلى جميع المدن المغربية مع إمكانية الدفع عند الاستلام، لأن ثقتك أهم ما لدينا.",
        ]
      : [
          "Dar Elegance est née à Casablanca d'une idée simple : des vêtements modernes, de belle qualité, à un prix juste, pensés pour le quotidien au Maroc.",
          "Nous sélectionnons nos matières avec soin et travaillons avec des ateliers locaux pour garantir la qualité de chaque pièce, de la couture à l'emballage.",
          "Nous livrons dans toutes les villes du Maroc avec le paiement à la livraison, parce que votre confiance compte avant tout.",
        ];

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl md:text-4xl">{t("aboutTitle")}</h1>
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
          alt={t("aboutTitle")}
          className="aspect-[16/9] w-full rounded-lg object-cover"
          loading="lazy"
        />
        {body.map((p) => (
          <p key={p} className="leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
