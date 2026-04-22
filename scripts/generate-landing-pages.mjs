import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { APP, HOME_LOCALES, HUB_SECTIONS, PAGES } from "../seo/landing-pages.mjs";
import { LANDING_COPY, KEYWORD_TRANSLATIONS } from "../seo/landing-locales.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const NAV_MARKER = {
  start: "<!-- SEO_GUIDES_NAV_START -->",
  end: "<!-- SEO_GUIDES_NAV_END -->",
};
const FOOTER_MARKER = {
  start: "<!-- SEO_GUIDES_FOOTER_START -->",
  end: "<!-- SEO_GUIDES_FOOTER_END -->",
};

const ENGLISH_COPY = {
  lang: "en",
  home: "Home",
  guides: "Guides",
  download: "Download Free",
  related: "Related guides",
  explore: "Explore all guides",
  back: "Back to Paint Color Visualizer",
  badge: "Free on iOS",
  pages: "pages",
  hubKicker: "search-driven guides",
  hubTitle: "Paint visualizer guides for real rooms, exteriors, and brand comparisons",
  hubDescription:
    "Browse pages built around the exact searches people use when they want a paint simulator, a real-photo room visualizer, a better brand comparison workflow, or an AI-assisted paint preview.",
  hubCtaTitle: "Test paint colors on your own photo",
  hubCtaBody:
    "Paint Color Visualizer helps you compare real brand colors on the room or house you actually plan to paint, without relying on generic example scenes.",
  hubSections: {
    simulators: {
      title: "Room and house simulators",
      intro:
        "These guides focus on room and house simulators that use real photos instead of generic stock-room mockups.",
    },
    brands: {
      title: "Brand and retailer comparisons",
      intro:
        "These pages target searches for brand-specific visualizers and multi-brand comparisons on the same real photo.",
    },
    best: {
      title: "Best app comparisons",
      intro:
        "These guides answer comparison-heavy searches from people who want the best app or tool for narrowing paint choices before buying samples.",
    },
    photo: {
      title: "Photo upload, exterior, and workflow searches",
      intro:
        "These pages are for people who want to upload their own photo, preview an exterior, or work from their real home instead of a template.",
    },
    ai: {
      title: "AI paint visualizer searches",
      intro:
        "These guides focus on AI-assisted wall detection, faster masking, and more realistic previews on real spaces.",
    },
  },
  meta:
    "Compare {keyword} on your own photo with real paint brands in Paint Color Visualizer.",
  hero:
    'If you searched for "{keyword}", you probably want to preview paint on a real photo before you buy. Paint Color Visualizer lets you upload your own room or house image, compare real brand colors, and save multiple versions quickly.',
  s1h: "What this search usually means",
  s1l:
    'Most searches like "{keyword}" are really about getting a more realistic preview before painting.',
  s1b:
    "The app works with real room and house photos instead of forcing you to rely on generic example scenes.",
  s2h: "Why your own photo matters",
  s2l: "Your own space gives you far better context than a swatch or stock room.",
  s2b:
    "Lighting, trim, flooring, furniture, landscaping, and shadows all change the way paint looks in practice.",
  s3h: "Compare options faster",
  s3l: "You can test several directions without rebuilding the preview every time.",
  s3b:
    "Upload a photo, switch between real paint colors, and compare saved versions until the right option stands out.",
  s3brand:
    "Test {brand} colors on your own photo and compare them with other major brands in the same workflow.",
  s3exterior:
    "Use separate previews for siding, trim, shutters, doors, and other exterior details on the same house photo.",
  s3ai:
    "AI-assisted surface detection helps you isolate paintable areas faster and keeps the preview workflow moving.",
  s4h: "Best for narrowing the shortlist",
  s4l:
    "The goal is to arrive at a stronger shortlist before buying samples or paint.",
  s4b:
    "Save the best versions, compare them later with fresher eyes, and share the top options before you decide.",
  cta:
    "Download Paint Color Visualizer to test real paint colors on your own room or house photo before you spend money on samples or labor.",
  card: "Preview this idea on your own photo with real paint brands.",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function capitalize(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function localeHrefLang(code) {
  if (code === "zh-CN") return "zh-Hans";
  if (code === "zh-TW") return "zh-Hant";
  return code;
}

function getLocaleCopy(locale) {
  return locale.code === "en" ? ENGLISH_COPY : LANDING_COPY[locale.code];
}

function isDefaultLocale(locale) {
  return locale.code === "en";
}

function localeHomeUrl(locale) {
  return isDefaultLocale(locale) ? `${APP.baseUrl}/` : `${APP.baseUrl}/${locale.path}/`;
}

function localeGuidesUrl(locale) {
  return isDefaultLocale(locale) ? `${APP.baseUrl}/guides/` : `${APP.baseUrl}/${locale.path}/guides/`;
}

function getAppStoreUrl(campaignType) {
  if (!campaignType) return APP.appStoreUrl;

  const url = new URL(APP.appStoreUrl);
  url.searchParams.set("ct", campaignType);
  return url.toString();
}

function pageUrl(page, locale) {
  return isDefaultLocale(locale)
    ? `${APP.baseUrl}/${page.slug}/`
    : `${APP.baseUrl}/${locale.path}/${page.slug}/`;
}

function pageDir(page, locale) {
  return isDefaultLocale(locale)
    ? path.join(rootDir, page.slug)
    : path.join(rootDir, locale.path, page.slug);
}

function guidesDir(locale) {
  return isDefaultLocale(locale)
    ? path.join(rootDir, "guides")
    : path.join(rootDir, locale.path, "guides");
}

function getKeyword(page, locale) {
  if (isDefaultLocale(locale)) return page.keyword;
  return KEYWORD_TRANSLATIONS[locale.code]?.[page.slug] ?? page.keyword;
}

function getDisplayKeyword(page, locale) {
  return capitalize(getKeyword(page, locale));
}

function slugifyCampaignPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLandingPageSlug(locale, slug) {
  const parts = [];
  if (!isDefaultLocale(locale)) parts.push(locale.path);
  parts.push(slug);
  return parts.map(slugifyCampaignPart).filter(Boolean).join("-");
}

function getQrCampaignType(locale, slug) {
  return `QRCode-${getLandingPageSlug(locale, slug)}`;
}

function getQrCodeImageUrl(campaignType) {
  const url = new URL("https://api.qrserver.com/v1/create-qr-code/");
  url.searchParams.set("size", "176x176");
  url.searchParams.set("format", "svg");
  url.searchParams.set("margin", "0");
  url.searchParams.set("data", getAppStoreUrl(campaignType));
  return url.toString();
}

function getAlternatesForPage(page) {
  return HOME_LOCALES.map((locale) => ({
    hreflang: localeHrefLang(locale.code),
    href: pageUrl(page, locale),
  })).concat([{ hreflang: "x-default", href: pageUrl(page, HOME_LOCALES[0]) }]);
}

function getAlternatesForHub() {
  return HOME_LOCALES.map((locale) => ({
    hreflang: localeHrefLang(locale.code),
    href: localeGuidesUrl(locale),
  })).concat([{ hreflang: "x-default", href: localeGuidesUrl(HOME_LOCALES[0]) }]);
}

function getAlternatesForHome() {
  return HOME_LOCALES.map((locale) => ({
    hreflang: localeHrefLang(locale.code),
    href: localeHomeUrl(locale),
  })).concat([{ hreflang: "x-default", href: localeHomeUrl(HOME_LOCALES[0]) }]);
}

function renderAlternateLinks(alternates) {
  return alternates
    .map(
      (alternate) =>
        `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}">`
    )
    .join("\n  ");
}

function renderDownloadButton({ href, label, linkClassName, placement, qrCodeImageUrl }) {
  return `        <div class="download-cta download-cta--${placement}">
          <a class="${linkClassName}" href="${href}">${escapeHtml(label)}</a>
          <span class="download-qr" aria-hidden="true">
            <img src="${qrCodeImageUrl}" alt="" width="176" height="176" loading="lazy" decoding="async">
          </span>
        </div>`;
}

function renderHead({ title, description, canonicalUrl, structuredData, lang, alternates }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="apple-itunes-app" content="app-id=${APP.appStoreId}">
  <link rel="canonical" href="${canonicalUrl}">
  ${renderAlternateLinks(alternates)}
  <link rel="icon" href="${APP.imagePath}" type="image/png">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${APP.iconUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${APP.iconUrl}">
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/landing-pages.css">
  <script src="/js/landing-pages.js" defer></script>
</head>`;
}

function buildEnglishSections(page) {
  const sharedDecisionBody =
    "Once the strongest options are saved, you can come back with fresher eyes, compare them with a partner or client, and narrow the list before spending money on samples.";

  switch (page.kind) {
    case "brand":
      return [
        {
          heading: `What people usually want from a ${page.brand} visualizer`,
          lead: `Searches like "${page.keyword}" are usually about one thing: ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "Use one photo for every color comparison",
          lead: "The best way to judge a brand color is to keep the room or house constant while the color changes.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Why brand-only workflows feel limiting",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: `Best for ${page.brand} shoppers who still want options`,
          lead: "This kind of workflow is strongest when you already like one brand but do not want to rule out a better match too early.",
          body: sharedDecisionBody,
        },
      ];
    case "exterior":
      return [
        {
          heading: "What matters in an exterior paint preview",
          lead: `Searches like "${page.keyword}" usually come from homeowners trying to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "Why your own facade matters more than a demo house",
          lead: "Exterior color choices are expensive because the paint covers so much visible area.",
          body: `${page.problem}.`,
        },
        {
          heading: "Compare body color, trim, and accents separately",
          lead: "A strong exterior visualizer should let you test more than one surface at a time.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Avoid costly curb-appeal mistakes",
          lead: "Exterior projects usually fail when the final color is judged too late, after the full facade is already covered.",
          body: `${page.comparison}. ${sharedDecisionBody}`,
        },
      ];
    case "photo":
      return [
        {
          heading: "Why upload-photo workflows matter",
          lead: `Most searches for "${page.keyword}" are really about being able to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "What Paint Color Visualizer does better",
          lead: "The app is designed around real project photos, not just inspiration browsing.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Where generic visualizers lose value",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: "Best fit for real remodel and repaint decisions",
          lead: "This workflow is strongest when you need to cut uncertainty before buying paint, samples, or labor.",
          body: sharedDecisionBody,
        },
      ];
    case "best":
      return [
        {
          heading: "What actually makes a paint visualizer the best",
          lead: `Searches like "${page.keyword}" are comparison-heavy because people want a tool they can actually trust.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "Use your own photo, not a placeholder room",
          lead: "The strongest paint visualizer is the one that keeps the decision tied to the actual space you plan to paint.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Compare brands instead of switching tools",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: "Best for people trying to narrow the shortlist quickly",
          lead: "A good comparison tool should help you eliminate weak candidates before you ever buy a sample.",
          body: sharedDecisionBody,
        },
      ];
    case "app":
      return [
        {
          heading: "Why a dedicated app helps with paint decisions",
          lead: `Searches like "${page.keyword}" usually happen when someone wants to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "A mobile workflow that stays tied to the room",
          lead: "The biggest benefit of an app is speed: you can use it while standing in the room or while comparing colors in the store.",
          body: `${page.workflow}.`,
        },
        {
          heading: "How it reduces decision risk",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: "Best for homeowners who want fewer sample mistakes",
          lead: "A good paint app should help you narrow the field before money leaves your wallet.",
          body: sharedDecisionBody,
        },
      ];
    case "ai":
      return [
        {
          heading: "Where AI actually helps in paint visualization",
          lead: `Searches like "${page.keyword}" are usually about using AI to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "AI plus real brand colors is what matters",
          lead: "AI is only useful here if it makes the preview workflow faster and cleaner without sacrificing real paint options.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Avoid gimmicky paint previews",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: "Best for fast experimentation on real photos",
          lead: "This approach works well for homeowners, designers, and contractors who want to test several directions quickly.",
          body: sharedDecisionBody,
        },
      ];
    case "room":
      return [
        {
          heading: "What people mean by this kind of search",
          lead: `Most searches for "${page.keyword}" are really about wanting to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "Why room context changes everything",
          lead: "Paint rarely fails because the swatch looked bad. It fails because the full room changes once the walls, trim, flooring, and furniture interact with the color.",
          body: `${capitalize(page.problem)}.`,
        },
        {
          heading: "Save versions and compare them side by side",
          lead: "The most useful part of a virtual paint app is not the first preview. It is the ability to compare several realistic contenders on the same room.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Best for narrowing the shortlist before you sample",
          lead: "This kind of workflow is strongest before the paint purchase, when you still want to test multiple directions cheaply and quickly.",
          body: `${page.comparison}. ${sharedDecisionBody}`,
        },
      ];
    case "simulator":
    default:
      return [
        {
          heading: "What people want from a real paint simulator",
          lead: `Searches like "${page.keyword}" usually come from people trying to ${page.searchIntent}.`,
          body: `${page.advantage}.`,
        },
        {
          heading: "Why the photo should come first",
          lead: "A simulator becomes much more useful when it starts from the exact room or house that will actually be painted.",
          body: `${page.workflow}.`,
        },
        {
          heading: "Where other simulators fall short",
          lead: `${capitalize(page.problem)}.`,
          body: `${page.comparison}.`,
        },
        {
          heading: "Best for making a shortlist before paint day",
          lead: "The real value of a simulator is narrowing options before the expensive part of the project begins.",
          body: sharedDecisionBody,
        },
      ];
  }
}

function buildLocalizedSections(page, locale) {
  const copy = getLocaleCopy(locale);
  let thirdBody = copy.s3b;
  if (page.kind === "brand") thirdBody = fill(copy.s3brand, { brand: page.brand });
  if (page.kind === "exterior") thirdBody = copy.s3exterior;
  if (page.kind === "ai") thirdBody = copy.s3ai;

  return [
    {
      heading: copy.s1h,
      lead: fill(copy.s1l, { keyword: getKeyword(page, locale) }),
      body: copy.s1b,
    },
    {
      heading: copy.s2h,
      lead: copy.s2l,
      body: copy.s2b,
    },
    {
      heading: copy.s3h,
      lead: copy.s3l,
      body: thirdBody,
    },
    {
      heading: copy.s4h,
      lead: copy.s4l,
      body: copy.s4b,
    },
  ];
}

function getRelatedPages(page, limit = 4) {
  return PAGES.filter((candidate) => candidate.slug !== page.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => page.tags.includes(tag)).length;
      let score = sharedTags * 4;
      if (candidate.group === page.group) score += 5;
      if (candidate.kind === page.kind) score += 3;
      if (page.kind === "brand" && candidate.group === "best") score += 1;
      if (page.kind === "simulator" && candidate.group === "photo") score += 1;
      if (page.kind === "photo" && candidate.group === "simulators") score += 1;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.candidate.slug.localeCompare(b.candidate.slug))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

function renderEnglishPage(page) {
  const canonicalUrl = pageUrl(page, HOME_LOCALES[0]);
  const appStoreUrl = getAppStoreUrl();
  const qrCodeImageUrl = getQrCodeImageUrl(getQrCampaignType(HOME_LOCALES[0], page.slug));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "MobileApplication"],
    name: APP.name,
    operatingSystem: "iOS",
    applicationCategory: "UtilitiesApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    downloadUrl: appStoreUrl,
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", reviewCount: "60" },
  };
  const relatedPages = getRelatedPages(page);

  return `${renderHead({
    title: page.title,
    description: page.metaDescription,
    canonicalUrl,
    structuredData,
    lang: "en",
    alternates: getAlternatesForPage(page),
  })}
<body>
  <nav>
    <a class="home" href="${localeHomeUrl(HOME_LOCALES[0])}">${APP.name}</a>
    <div class="nav-actions">
      <a class="nav-link" href="${localeGuidesUrl(HOME_LOCALES[0])}">${ENGLISH_COPY.guides}</a>
${renderDownloadButton({
  href: appStoreUrl,
  label: ENGLISH_COPY.download,
  linkClassName: "dl",
  placement: "nav",
  qrCodeImageUrl,
})}
    </div>
  </nav>
  <div class="hero">
    <div class="badge">${ENGLISH_COPY.badge}</div>
    <h1>${escapeHtml(page.heroTitle)}</h1>
    <p>${escapeHtml(page.heroBody)}</p>
  </div>
  <div class="ed-main">
    <main>
${buildEnglishSections(page)
  .map(
    (section, index) => `      <section class="ed-section fade-section">
        <div class="ed-section-inner">
          <span class="ed-section-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <div class="ed-section-body">
            <h2>${escapeHtml(section.heading)}</h2>
            <p class="ed-lead">${escapeHtml(section.lead)}</p>
            <p>${escapeHtml(section.body)}</p>
          </div>
        </div>
      </section>`
  )
  .join("\n")}
      <section class="related-links fade-in">
        <h2>${ENGLISH_COPY.related}</h2>
        <div class="related-grid">
${relatedPages
  .map(
    (related) => `          <a class="related-card" href="${pageUrl(related, HOME_LOCALES[0])}">
            <span class="card-eyebrow">${escapeHtml(related.keyword)}</span>
            <h3>${escapeHtml(related.cardTitle)}</h3>
            <p>${escapeHtml(related.cardDescription)}</p>
          </a>`
  )
  .join("\n")}
        </div>
      </section>
      <div class="cta fade-in">
        <h2>${escapeHtml(page.cardTitle)} for your real home</h2>
        <p>${ENGLISH_COPY.cta}</p>
${renderDownloadButton({
  href: appStoreUrl,
  label: "Download on the App Store - Free",
  linkClassName: "btn",
  placement: "cta",
  qrCodeImageUrl,
})}
      </div>
    </main>
  </div>
  <footer>
    <div class="footer-nav">
      <a href="${localeGuidesUrl(HOME_LOCALES[0])}">${ENGLISH_COPY.explore}</a>
      <span>&bull;</span>
      <a href="${localeHomeUrl(HOME_LOCALES[0])}">${ENGLISH_COPY.back}</a>
    </div>
  </footer>
</body>
</html>
`;
}

function renderLocalizedPage(page, locale) {
  const copy = getLocaleCopy(locale);
  const canonicalUrl = pageUrl(page, locale);
  const keyword = getKeyword(page, locale);
  const displayKeyword = getDisplayKeyword(page, locale);
  const relatedPages = getRelatedPages(page);
  const appStoreUrl = getAppStoreUrl();
  const qrCodeImageUrl = getQrCodeImageUrl(getQrCampaignType(locale, page.slug));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "MobileApplication"],
    name: APP.name,
    operatingSystem: "iOS",
    applicationCategory: "UtilitiesApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    downloadUrl: appStoreUrl,
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.5", reviewCount: "60" },
    inLanguage: copy.lang,
  };

  return `${renderHead({
    title: `${displayKeyword} | ${APP.name}`,
    description: fill(copy.meta, { keyword }),
    canonicalUrl,
    structuredData,
    lang: copy.lang,
    alternates: getAlternatesForPage(page),
  })}
<body>
  <nav>
    <a class="home" href="${localeHomeUrl(locale)}">${APP.name}</a>
    <div class="nav-actions">
      <a class="nav-link" href="${localeGuidesUrl(locale)}">${copy.guides}</a>
${renderDownloadButton({
  href: appStoreUrl,
  label: copy.download,
  linkClassName: "dl",
  placement: "nav",
  qrCodeImageUrl,
})}
    </div>
  </nav>
  <div class="hero">
    <div class="badge">${copy.badge}</div>
    <h1>${escapeHtml(displayKeyword)}</h1>
    <p>${escapeHtml(fill(copy.hero, { keyword }))}</p>
  </div>
  <div class="ed-main">
    <main>
${buildLocalizedSections(page, locale)
  .map(
    (section, index) => `      <section class="ed-section fade-section">
        <div class="ed-section-inner">
          <span class="ed-section-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <div class="ed-section-body">
            <h2>${escapeHtml(section.heading)}</h2>
            <p class="ed-lead">${escapeHtml(section.lead)}</p>
            <p>${escapeHtml(section.body)}</p>
          </div>
        </div>
      </section>`
  )
  .join("\n")}
      <section class="related-links fade-in">
        <h2>${copy.related}</h2>
        <div class="related-grid">
${relatedPages
  .map(
    (related) => `          <a class="related-card" href="${pageUrl(related, locale)}">
            <span class="card-eyebrow">${escapeHtml(getKeyword(related, locale))}</span>
            <h3>${escapeHtml(getDisplayKeyword(related, locale))}</h3>
            <p>${escapeHtml(copy.card)}</p>
          </a>`
  )
  .join("\n")}
        </div>
      </section>
      <div class="cta fade-in">
        <h2>${escapeHtml(displayKeyword)}</h2>
        <p>${copy.cta}</p>
${renderDownloadButton({
  href: appStoreUrl,
  label: copy.download,
  linkClassName: "btn",
  placement: "cta",
  qrCodeImageUrl,
})}
      </div>
    </main>
  </div>
  <footer>
    <div class="footer-nav">
      <a href="${localeGuidesUrl(locale)}">${copy.explore}</a>
      <span>&bull;</span>
      <a href="${localeHomeUrl(locale)}">${copy.back}</a>
    </div>
  </footer>
</body>
</html>
`;
}

function renderHub(locale) {
  const copy = getLocaleCopy(locale);
  const canonicalUrl = localeGuidesUrl(locale);
  const appStoreUrl = getAppStoreUrl();
  const qrCodeImageUrl = getQrCodeImageUrl(getQrCampaignType(locale, "guides"));
  const groupedSections = HUB_SECTIONS.map((section) => ({
    slug: section.slug,
    pages: PAGES.filter((page) => page.group === section.slug),
    title: copy.hubSections[section.slug].title,
    intro: copy.hubSections[section.slug].intro,
  }));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.hubTitle,
    url: canonicalUrl,
    inLanguage: copy.lang,
  };

  return `${renderHead({
    title: `${copy.hubTitle} | ${APP.name}`,
    description: copy.hubDescription,
    canonicalUrl,
    structuredData,
    lang: copy.lang,
    alternates: getAlternatesForHub(),
  })}
<body>
  <nav>
    <a class="home" href="${localeHomeUrl(locale)}">${APP.name}</a>
    <div class="nav-actions">
      <a class="nav-link" href="${localeHomeUrl(locale)}">${copy.home}</a>
${renderDownloadButton({
  href: appStoreUrl,
  label: copy.download,
  linkClassName: "dl",
  placement: "nav",
  qrCodeImageUrl,
})}
    </div>
  </nav>
  <div class="hero">
    <div class="hero-kicker">${PAGES.length} ${copy.hubKicker}</div>
    <h1>${escapeHtml(copy.hubTitle)}</h1>
    <p>${escapeHtml(copy.hubDescription)}</p>
  </div>
  <div class="ed-main hub-main">
    <main class="hub-content">
${groupedSections
  .map(
    (section) => `      <section class="hub-section fade-in" id="${section.slug}">
        <div class="hub-heading-row">
          <h2>${escapeHtml(section.title)}</h2>
          <span class="hub-count">${section.pages.length} ${copy.pages}</span>
        </div>
        <p class="hub-intro">${escapeHtml(section.intro)}</p>
        <div class="hub-grid">
${section.pages
  .map(
    (page) => `          <a class="hub-card" href="${pageUrl(page, locale)}">
            <span class="card-eyebrow">${escapeHtml(getKeyword(page, locale))}</span>
            <h3>${escapeHtml(getDisplayKeyword(page, locale))}</h3>
            <p>${escapeHtml(copy.card)}</p>
          </a>`
  )
  .join("\n")}
        </div>
      </section>`
  )
  .join("\n")}
      <div class="cta fade-in">
        <h2>${escapeHtml(copy.hubCtaTitle)}</h2>
        <p>${escapeHtml(copy.hubCtaBody)}</p>
${renderDownloadButton({
  href: appStoreUrl,
  label: copy.download,
  linkClassName: "btn",
  placement: "cta",
  qrCodeImageUrl,
})}
      </div>
    </main>
  </div>
  <footer>
    <div class="footer-nav">
      <a href="${localeHomeUrl(locale)}">${copy.back}</a>
    </div>
  </footer>
</body>
</html>
`;
}

async function writeLandingPages() {
  for (const locale of HOME_LOCALES) {
    for (const page of PAGES) {
      const dir = pageDir(page, locale);
      await fs.mkdir(dir, { recursive: true });
      const html = isDefaultLocale(locale)
        ? renderEnglishPage(page)
        : renderLocalizedPage(page, locale);
      await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
    }

    const hubDir = guidesDir(locale);
    await fs.mkdir(hubDir, { recursive: true });
    await fs.writeFile(path.join(hubDir, "index.html"), renderHub(locale), "utf8");
  }
}

function replaceOrInsertGuideBlock(content, marker, block, targetPattern) {
  const markerPattern = new RegExp(`${marker.start}[\\s\\S]*?${marker.end}`, "m");
  if (markerPattern.test(content)) {
    return content.replace(markerPattern, block);
  }

  if (!targetPattern.test(content)) {
    throw new Error(`Could not find insertion target for ${marker.start}`);
  }

  return content.replace(targetPattern, `$1\n${block}`);
}

function renderHomeAlternateLinks() {
  return renderAlternateLinks(getAlternatesForHome());
}

async function syncHomepageGuideLinks() {
  for (const locale of HOME_LOCALES) {
    const homePath = isDefaultLocale(locale)
      ? path.join(rootDir, "index.html")
      : path.join(rootDir, locale.path, "index.html");
    const original = await fs.readFile(homePath, "utf8");
    const navBlock = `                        ${NAV_MARKER.start}<li><a href="${localeGuidesUrl(locale)}">${locale.label}</a></li>${NAV_MARKER.end}`;
    const footerBlock = `                        ${FOOTER_MARKER.start}<li><a href="${localeGuidesUrl(locale)}">${locale.label}</a></li>${FOOTER_MARKER.end}`;

    let next = original.replace(
      /(<link rel="canonical" href="[^"]+">\n)([\s\S]*?)(\s*<link rel="icon" href="images\/app-icon\.png" type="image\/png">)/m,
      `$1${renderHomeAlternateLinks()}\n$3`
    );

    next = replaceOrInsertGuideBlock(
      next,
      NAV_MARKER,
      navBlock,
      /(\s*<li><a href="#screenshots"><span data-i18n="nav_screenshots">Screenshots<\/span><\/a><\/li>)/m
    );

    next = replaceOrInsertGuideBlock(
      next,
      FOOTER_MARKER,
      footerBlock,
      /(\s*<li><a href="#testimonials"><span data-i18n="footer_link_reviews">Reviews<\/span><\/a><\/li>)/m
    );

    await fs.writeFile(homePath, next, "utf8");
  }
}

function renderSitemapEntry({ loc, alternates, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${alternates
  .map(
    (alternate) =>
      `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${escapeXml(alternate.href)}"/>`
  )
  .join("\n")}
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function writeSitemap() {
  const homeAlternates = getAlternatesForHome();
  const hubAlternates = getAlternatesForHub();
  const entries = [];

  for (const locale of HOME_LOCALES) {
    entries.push(
      renderSitemapEntry({
        loc: localeHomeUrl(locale),
        alternates: homeAlternates,
        priority: isDefaultLocale(locale) ? "1.0" : "0.9",
      })
    );
  }

  for (const locale of HOME_LOCALES) {
    entries.push(
      renderSitemapEntry({
        loc: localeGuidesUrl(locale),
        alternates: hubAlternates,
        priority: isDefaultLocale(locale) ? "0.85" : "0.75",
      })
    );
  }

  for (const page of PAGES) {
    const alternates = getAlternatesForPage(page);
    for (const locale of HOME_LOCALES) {
      entries.push(
        renderSitemapEntry({
          loc: pageUrl(page, locale),
          alternates,
          priority: isDefaultLocale(locale) ? "0.8" : "0.7",
        })
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

  await fs.writeFile(path.join(rootDir, "sitemap.xml"), xml, "utf8");
}

async function main() {
  await writeLandingPages();
  await syncHomepageGuideLinks();
  await writeSitemap();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
