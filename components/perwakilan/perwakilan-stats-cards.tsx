import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildingIcon, HashIcon, UsersIcon, ClipboardCheckIcon } from "lucide-react";

interface PerwakilanStatsCardsProps {
  totalCabang: number;
  totalWithKode: number;
  totalWithUser: number;
  totalWithJawaban: number;
}

export function PerwakilanStatsCards({
  totalCabang,
  totalWithKode,
  totalWithUser,
  totalWithJawaban,
}: PerwakilanStatsCardsProps) {
  const stats = [
    {
      title: "Total Perwakilan",
      value: totalCabang,
      description: "Perwakilan daerah terdaftar",
      icon: BuildingIcon,
    },
    {
      title: "Memiliki Kode Cabang",
      value: totalWithKode,
      description: "Standarisasi kode singkatan",
      icon: HashIcon,
    },
    {
      title: "Akun Pengguna Tertaut",
      value: totalWithUser,
      description: "Memiliki akun audite cabang",
      icon: UsersIcon,
    },
    {
      title: "Partisipasi Audit",
      value: totalWithJawaban,
      description: "Sudah mulai mengisi instrumen",
      icon: ClipboardCheckIcon,
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
