import Script from "next/script";

/**
 * Microsoft Clarity — server component so the project ID can come from
 * runtime env on VPS/Docker (`CLARITY_PROJECT_ID`), not only from a
 * NEXT_PUBLIC_ value baked at `next build` time.
 */
function clarityProjectId(): string {
  const raw =
    process.env.CLARITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ||
    "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

export default function MicrosoftClarity() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const projectId = clarityProjectId();
  if (!projectId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(projectId)});
        `.trim(),
      }}
    />
  );
}
