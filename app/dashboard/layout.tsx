import { AppFrame } from "@/components/navigation/AppFrame";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AppFrame>{children}</AppFrame>;
}
