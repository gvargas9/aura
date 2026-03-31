import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
};

/**
 * Minimal layout for the embeddable product widget.
 * Overrides root layout background and hides the floating chat widget via CSS.
 * No navbar, no footer -- just themed product content.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body {
              background: transparent !important;
              background-image: none !important;
              min-height: auto !important;
            }
            /* Hide the Aura floating chat widget and panel in embed mode */
            body > div[role="dialog"],
            body > button[aria-label*="Aura chat"] {
              display: none !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
