/**
 * Home page — Server Component.
 * No "use client" here: the page itself is rendered on the server.
 * Animation + interactivity is delegated to <HomeAnimations> (a thin client component).
 */
import HomeAnimations from "./HomeAnimations";

export default function Home() {
  return <HomeAnimations />;
}
