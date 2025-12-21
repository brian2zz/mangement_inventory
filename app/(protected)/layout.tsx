"use client";

import { useRequireAuth } from "@/components/use-require-auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRequireAuth();
  return <>{children}</>;
}
