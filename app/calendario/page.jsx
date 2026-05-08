import { getLatestArticles } from "../../lib/contentful";
import { getRevistas } from "../../lib/revistas";
import CalendarClient from "../../components/calendar/CalendarClient";

export const revalidate = 3600;

export default async function CalendarPage() {
  const [articles, revistas] = await Promise.all([
    getLatestArticles(100),
    getRevistas(),
  ]);
  return <CalendarClient articles={articles} revistas={revistas} />;
}
