import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { languages } from "../../data/catalog.js";
import { Logo } from "../components/ui/logo";
import { LiquidNavbar, NimbusIcons } from "../components/ui/liquid-glass-navbar";
import { ThemeSwitch } from "../components/ui/theme-switch";
import { useDarkTheme, useTravel } from "../shared/context";
import type { Page, Theme } from "../shared/model";
import { Icon } from "../shared/ui";

export const pages: Exclude<Page, "welcome">[] = ["places", "tickets", "saved", "planner"];

export function Brand() {
  return <a className="brand" href="#welcome" aria-label="AstraTravel">
    <Logo size={34} /><span>Astra<span>Travel</span></span>
  </a>;
}

/** The liquid-glass navbar: the water drop flows to the current page; on phones it floats at the bottom. */
export function Navigation({ page, mobile = false }: { page: Page; mobile?: boolean }) {
  const { t } = useTravel();
  const dark = useDarkTheme();
  const items = [
    { label: t("places"), href: "#places", icon: NimbusIcons.globe, fx: "spin" as const },
    { label: t("tickets"), href: "#tickets", icon: NimbusIcons.plane, fx: "plane" as const },
    { label: t("saved"), href: "#saved", icon: NimbusIcons.heart, fx: "pop" as const },
    { label: t("planner"), href: "#planner", icon: NimbusIcons.route, fx: "drop" as const },
  ];
  // Pages outside the navbar (welcome, chat, account, admin…) leave the water drop out.
  const active = pages.indexOf(page as Exclude<Page, "welcome">);
  return <LiquidNavbar items={items} active={active} tone={dark ? "dark" : "light"} label={t("navigation")}
    compact={mobile ? true : undefined} className={mobile ? "mobile-nav" : "desktop-nav"} />;
}

const themeLabel = { system: "themeSystem", light: "themeLight", dark: "themeDark" } as const;

export function Header({ page, signedIn, theme, onTheme }: {
  page: Page; signedIn: boolean; theme: Theme; onTheme: (theme: Theme, event?: ReactMouseEvent) => void;
}) {
  const { t, open, language } = useTravel();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className="site-header" data-scrolled={scrolled || undefined}><div className="shell header-inner glass">
    <Brand /><Navigation page={page} />
    <div className="header-actions">
      <ThemeSwitch value={theme} onChange={onTheme} labels={{ system: t(themeLabel.system), light: t(themeLabel.light), dark: t(themeLabel.dark) }} />
      <button className="button button-small header-language" type="button" aria-label={t("language") + ": " + languages[language]} onClick={() => open({ kind: "profile" })}>
        <span className="header-language-mark" aria-hidden="true">Aa</span><span className="header-language-code">{language.toUpperCase()}</span>
      </button>
      <button className="button button-primary button-small header-account" type="button" onClick={() => open({ kind: "account" })}>
        <Icon name="user" size={17} /><span>{t(signedIn ? "profile" : "signIn")}</span>
      </button>
    </div>
  </div></header>;
}

export function Footer() {
  const { t, open } = useTravel();
  return <footer className="site-footer"><div className="shell footer-inner">
    <Brand />
    <p>{t("illustrative")}</p>
    <button type="button" className="text-link" onClick={() => open({ kind: "credits" })}><Icon name="camera" size={15} />{t("photoCredits")}</button>
    <nav className="footer-links" aria-label={t("legal")}><a href="#assistant">{t("assistant")}</a><a href="#privacy">{t("privacy")}</a><a href="#terms">{t("terms")}</a></nav>
  </div></footer>;
}
