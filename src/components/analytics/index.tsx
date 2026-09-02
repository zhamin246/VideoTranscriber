import GoogleAnalytics from "./google-analytics";
import OpenPanelAnalytics from "./open-panel";
import Plausible from "./plausible";

/**
 * Client-safe analytics bundle (rendered from ThemeProvider).
 * Microsoft Clarity is injected from the root server layout so the
 * project ID can be read at runtime on VPS/Docker deploys.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <OpenPanelAnalytics />
      <GoogleAnalytics />
      <Plausible />
    </>
  );
}
