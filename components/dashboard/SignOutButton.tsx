"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface SignOutButtonProps {
  label: string;
}

export default function SignOutButton({ label }: SignOutButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
    >
      {label}
    </Button>
  );
}

