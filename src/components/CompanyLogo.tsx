const LOGO_DEV_TOKEN = 'pk_UNby4pHcTYmVCmN-UzG3jw';
const LOGO_DEV_BASE_URL = 'https://img.logo.dev';

type LogoFormat = 'jpg' | 'png' | 'webp';
type LogoTheme = 'auto' | 'light' | 'dark';
type LogoFallback = 'monogram' | '404';

type CompanyLogoProps = {
  name: string;
  domain?: string;
  size?: number;
  format?: LogoFormat;
  theme?: LogoTheme;
  fallback?: LogoFallback;
  retina?: boolean;
  className?: string;
};

type CompanyLogoUrlOptions = Required<Pick<CompanyLogoProps, 'name'>> &
  Pick<CompanyLogoProps, 'domain' | 'size' | 'format' | 'theme' | 'fallback' | 'retina'>;

export function companyLogoUrl({
  name,
  domain,
  size = 128,
  format = 'png',
  theme = 'auto',
  fallback = 'monogram',
  retina = true,
}: CompanyLogoUrlOptions) {
  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    size: String(size),
    format,
    theme,
    fallback,
  });

  if (retina) {
    params.set('retina', 'true');
  }

  const identifier = domain ? domain.trim().toLowerCase() : `name/${encodeURIComponent(name)}`;
  return `${LOGO_DEV_BASE_URL}/${identifier}?${params.toString()}`;
}

export function CompanyLogo({
  name,
  domain,
  size = 128,
  format = 'png',
  theme = 'auto',
  fallback = 'monogram',
  retina = true,
  className,
}: CompanyLogoProps) {
  return (
    <img
      src={companyLogoUrl({ name, domain, size, format, theme, fallback, retina })}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

export function LogoDevAttribution({ className }: { className?: string }) {
  return (
    <a className={className} href="https://www.logo.dev" target="_blank" rel="noreferrer">
      Logos by Logo.dev
    </a>
  );
}
