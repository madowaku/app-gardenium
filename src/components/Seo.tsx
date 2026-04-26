import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DEFAULT_LANGUAGE, localizePath, stripLanguagePrefix } from '../lib/i18nRoutes';

type SeoProps = {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
};

const copy = {
  en: {
    title: 'App Gardenium | Grow app ideas together',
    description: 'Plant tiny app ideas, get feedback, find early testers, and grow them into real products with makers and early users.',
  },
  ja: {
    title: 'App Gardenium | アプリのアイデアを、みんなで育てる',
    description: '「あったらいいな」のアプリ案を投稿し、フィードバックや初期テスターと出会いながら形にしていくコミュニティです。',
  },
};

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!element) {
    element = selector.startsWith('meta')
      ? document.createElement('meta')
      : document.createElement('link');

    if (selector.includes('name="description"')) {
      (element as HTMLMetaElement).name = 'description';
    } else if (selector.includes('name="robots"')) {
      (element as HTMLMetaElement).name = 'robots';
    } else if (selector.includes('property="og:')) {
      (element as HTMLMetaElement).setAttribute('property', selector.match(/og:[^"]+/)?.[0] || '');
    } else if (selector.includes('property="twitter:')) {
      (element as HTMLMetaElement).setAttribute('property', selector.match(/twitter:[^"]+/)?.[0] || '');
    } else if (selector.includes('rel="canonical"')) {
      (element as HTMLLinkElement).rel = 'canonical';
    }
    document.head.appendChild(element);
  }

  element.setAttribute(attr, value);
}

function setAlternate(hreflang: string, href: string) {
  let link = document.head.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function Seo({ title, description, image, type = 'website', noindex }: SeoProps) {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const siteUrl = window.location.origin;
    const path = stripLanguagePrefix(location.pathname);
    const localizedPath = localizePath(path, language || DEFAULT_LANGUAGE);
    const canonical = `${siteUrl}${localizedPath}`;
    const resolvedTitle = title || copy[language].title;
    const resolvedDescription = description || copy[language].description;
    const resolvedImage = image?.startsWith('http') ? image : image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`;

    document.documentElement.lang = language;
    document.title = resolvedTitle;

    setMeta('meta[name="description"]', 'content', resolvedDescription);
    setMeta('link[rel="canonical"]', 'href', canonical);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:title"]', 'content', resolvedTitle);
    setMeta('meta[property="og:description"]', 'content', resolvedDescription);
    setMeta('meta[property="og:image"]', 'content', resolvedImage);
    setMeta('meta[property="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[property="twitter:url"]', 'content', canonical);
    setMeta('meta[property="twitter:title"]', 'content', resolvedTitle);
    setMeta('meta[property="twitter:description"]', 'content', resolvedDescription);
    setMeta('meta[property="twitter:image"]', 'content', resolvedImage);
    setMeta('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow');

    setAlternate('en', `${siteUrl}${localizePath(path, 'en')}`);
    setAlternate('ja', `${siteUrl}${localizePath(path, 'ja')}`);
    setAlternate('x-default', `${siteUrl}/`);
  }, [description, image, language, location.pathname, noindex, title, type]);

  return null;
}
