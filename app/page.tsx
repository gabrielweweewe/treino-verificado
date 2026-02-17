import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  return <AuthGuard />;
}
