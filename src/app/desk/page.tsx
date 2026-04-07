import type { Metadata } from "next";
import { Suspense } from "react";
import DeskContent from "./DeskContent";

export const metadata: Metadata = {
  title: "The Request Desk",
  description:
    "Request a book that isn't in the library, or donate a PDF to the archive. This library grows with the community.",
};

export default function DeskPage() {
  return (
    <Suspense>
      <DeskContent />
    </Suspense>
  );
}
