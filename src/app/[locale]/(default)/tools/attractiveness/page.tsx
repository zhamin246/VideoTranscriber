import { redirect } from "next/navigation";

/** Old slug → product URL */
export default function AttractivenessRedirect() {
  redirect("/tools/ai-attractiveness-test");
}
