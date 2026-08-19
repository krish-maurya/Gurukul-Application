import React from "react";
import { Redirect } from "expo-router";
import { PageLoader } from "@/src/components/UI";
import { useAuth } from "@/src/context/auth";

/** The first screen of a new install waits for SecureStore before routing. */
export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader message="Preparing your workspace" />;
  return <Redirect href={user?.role === "TEACHER" ? "/welcome" : user ? "/(tabs)" : "/(auth)/login"} />;
}
