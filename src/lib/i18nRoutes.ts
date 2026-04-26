import { Language } from '../contexts/LanguageContext';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'ja'];
export const DEFAULT_LANGUAGE: Language = 'en';

export function getPathLanguage(pathname: string): Language | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGUAGES.includes(firstSegment as Language) ? firstSegment as Language : null;
}

export function stripLanguagePrefix(pathname: string): string {
  const lang = getPathLanguage(pathname);
  if (!lang) return pathname || '/';

  const stripped = pathname.replace(new RegExp(`^/${lang}(?=/|$)`), '') || '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

export function localizePath(pathname: string, language: Language): string {
  const stripped = stripLanguagePrefix(pathname);
  return stripped === '/' ? `/${language}` : `/${language}${stripped}`;
}

export function switchPathLanguage(pathname: string, language: Language): string {
  return localizePath(stripLanguagePrefix(pathname), language);
}
