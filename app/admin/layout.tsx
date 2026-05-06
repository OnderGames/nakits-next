import AccountShell from "@/components/account/AccountShell";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountShell crumb="Yönetim paneli">{children}</AccountShell>
  );
}
