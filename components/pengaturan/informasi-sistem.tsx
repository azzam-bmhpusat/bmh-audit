"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2Icon,
  ShieldCheckIcon,
  WorkflowIcon,
} from "lucide-react";

export function InformasiSistem() {
  return (
    <div className="space-y-6">
      {/* 1. Informasi Lembaga & Sistem */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Identitas Lembaga & Unit</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Informasi entitas organisasi pengelola sistem audit kepatuhan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Nama Lembaga</span>
              <span className="font-medium text-foreground">LAZNAS Baitul Maal Hidayatullah</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Unit Pelaksana</span>
              <span className="font-medium text-foreground">Satuan Internal Audit (SIA)</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Sistem</span>
              <span className="font-medium text-foreground">Instrumen Audit Kepatuhan Integratif</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Status Pelaporan</span>
              <Badge variant="outline" className="text-[10px] py-0 px-2">
                Resmi & Terpadu
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Platform & Lingkungan</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Spesifikasi arsitektur teknologi pendukung BMH Audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Frontend Framework</span>
              <span className="font-mono text-[11px] text-foreground">Next.js 16 (App Router)</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">UI Design System</span>
              <span className="font-mono text-[11px] text-foreground">Tailwind v4 / Shadcn Base-Nova</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Database & Auth</span>
              <span className="font-mono text-[11px] text-foreground">PostgreSQL / Supabase SSR</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Keamanan Data</span>
              <span className="font-mono text-[11px] text-foreground">RLS Security Invoker</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. SOP Siklus Periode Audit */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <WorkflowIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">SOP Alur Siklus Periode Audit</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Panduan teknis bagi Auditor SIA dalam mengelola tahapan periode audit kepatuhan perwakilan cabang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  1
                </span>
                <span>Buka Periode</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Admin membuat periode baru (misal Semester-I) dan mengaktifkan status pengisian (<code className="text-[10px]">is_open = true</code>).
              </p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  2
                </span>
                <span>Isian Mandiri</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cabang mengunggah link evidence bukti dan memberikan skor asesmen mandiri (1–5) pada 72 butir instrumen.
              </p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  3
                </span>
                <span>Review Auditor</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Auditor SIA memeriksa keabsahan bukti lampiran, memvalidasi bukti, dan memberikan skor auditor serta catatan.
              </p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  4
                </span>
                <span>Kunci & Rekap</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Admin menutup periode (<code className="text-[10px]">is_open = false</code>) agar data terkunci. Hasil rekap dan predikat dapat diunduh dalam format Excel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
