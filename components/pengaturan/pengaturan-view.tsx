"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodeTable } from "./periode-table";
import { PredikatTableView } from "./predikat-table-view";
import { InstrumenOverview, type PilarSummary } from "./instrumen-overview";
import { InformasiSistem } from "./informasi-sistem";
import type { PeriodeDetailListItem, AuditPredikat } from "@/types/audit";
import {
  CalendarDaysIcon,
  AwardIcon,
  LayersIcon,
  InfoIcon,
} from "lucide-react";

interface PengaturanViewProps {
  periodeList: PeriodeDetailListItem[];
  predikatList: AuditPredikat[];
  pilarList: PilarSummary[];
  totalItem: number;
  totalVariabel: number;
  totalBobot: number;
  skorMaksimumIdeal: number;
}

export function PengaturanView({
  periodeList,
  predikatList,
  pilarList,
  totalItem,
  totalVariabel,
  totalBobot,
  skorMaksimumIdeal,
}: PengaturanViewProps) {
  const [activeTab, setActiveTab] = React.useState("periode");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase">
            PENGATURAN SISTEM AUDIT
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Satuan Internal Audit (SIA) • Portal Auditor BMH Pusat
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-9 p-1">
          <TabsTrigger value="periode" className="text-xs gap-1.5 px-3">
            <CalendarDaysIcon className="size-3.5" />
            <span>Periode Audit</span>
          </TabsTrigger>
          <TabsTrigger value="predikat" className="text-xs gap-1.5 px-3">
            <AwardIcon className="size-3.5" />
            <span>Standar Predikat</span>
          </TabsTrigger>
          <TabsTrigger value="instrumen" className="text-xs gap-1.5 px-3">
            <LayersIcon className="size-3.5" />
            <span>Struktur Instrumen</span>
          </TabsTrigger>
          <TabsTrigger value="informasi" className="text-xs gap-1.5 px-3">
            <InfoIcon className="size-3.5" />
            <span>Informasi & SOP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periode" className="space-y-4">
          <PeriodeTable periodeList={periodeList} />
        </TabsContent>

        <TabsContent value="predikat" className="space-y-4">
          <PredikatTableView predikatList={predikatList} />
        </TabsContent>

        <TabsContent value="instrumen" className="space-y-4">
          <InstrumenOverview
            pilarList={pilarList}
            totalItem={totalItem}
            totalVariabel={totalVariabel}
            totalBobot={totalBobot}
            skorMaksimumIdeal={skorMaksimumIdeal}
          />
        </TabsContent>

        <TabsContent value="informasi" className="space-y-4">
          <InformasiSistem />
        </TabsContent>
      </Tabs>
    </div>
  );
}
