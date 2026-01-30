import { getLatestArticles } from "../../lib/contentful";
import CalendarClient from "../../components/calendar/CalendarClient";

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function CalendarPage() {
  const articles = await getLatestArticles(100);

  return <CalendarClient articles={articles} />;
}
