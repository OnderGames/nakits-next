import AccountShell from "@/components/account/AccountShell";

export default function AccountSectionLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
