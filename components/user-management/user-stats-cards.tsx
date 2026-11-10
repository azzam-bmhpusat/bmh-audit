import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, ShieldCheckIcon, Building2Icon, KeyRoundIcon } from "lucide-react";

interface UserStatsCardsProps {
  totalUsers: number;
  totalAdmin: number;
  totalCabang: number;
  totalWajibGantiPassword: number;
}

export function UserStatsCards({
  totalUsers,
  totalAdmin,
  totalCabang,
  totalWajibGantiPassword,
}: UserStatsCardsProps) {
  const stats = [
    {
      title: "Total Pengguna",
      value: totalUsers,
      description: "Seluruh akun terdaftar",
      icon: UsersIcon,
    },
    {
      title: "Auditor SIA (Admin)",
      value: totalAdmin,
      description: "Hak akses penuh sistem",
      icon: ShieldCheckIcon,
    },
    {
      title: "Audite Cabang",
      value: totalCabang,
      description: "Akun perwakilan daerah",
      icon: Building2Icon,
    },
    {
      title: "Wajib Ganti Password",
      value: totalWajibGantiPassword,
      description: "Belum memperbarui password default",
      icon: KeyRoundIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
