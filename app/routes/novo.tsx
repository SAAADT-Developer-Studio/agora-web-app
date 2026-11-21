import { redirect } from "react-router";

/** `/novo` was the hidden story-ranked preview; the home feed now ranks stories. */
export function loader() {
  return redirect("/", 301);
}
