"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { Separator } from "@radix-ui/react-separator";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";

export default function CBSLRatesPage() {
  const [bulkText, setBulkText] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleSave = async () => {
    try {
      setStatus({ type: "loading" });

      // Parse the input text
      const rates = bulkText
        .trim()
        .split("\n")
        .map((line) => {
          const [date, rate] = line.trim().split(/\s+/);
          return {
            date,
            rate: Number(parseFloat(rate).toFixed(2)),
            timestamp: new Date(date).toISOString(),
          };
        })
        .filter((rate) => !isNaN(rate.rate) && rate.date);

      if (rates.length === 0) {
        throw new Error("No valid rates found in the input");
      }

      // Check which rates don't exist in Firestore
      const ratesRef = collection(db, "cbslRates");
      const newRates = [];

      for (const rate of rates) {
        const q = query(ratesRef, where("date", "==", rate.date));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          newRates.push(rate);
        }
      }

      // Add new rates to Firestore
      if (newRates.length > 0) {
        const promises = newRates.map((rate) => addDoc(ratesRef, rate));
        await Promise.all(promises);
        setStatus({
          type: "success",
          message: `Successfully added ${newRates.length} new rates`,
        });
      } else {
        setStatus({
          type: "success",
          message: "No new rates to add",
        });
      }

      // Clear the text area on success
      setBulkText("");
    } catch (error) {
      console.error("Error saving rates:", error);
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save rates",
      });
    }
  };

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">KeepRates</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Central Bank of Sri Lanka</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Add CBSL Rates</CardTitle>
              <CardDescription>
                Paste CBSL rates in the format: YYYY-MM-DD RATE (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="2025-01-21 296.8545&#10;2025-01-22 297.4952"
                value={bulkText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBulkText(e.target.value)
                }
                className="min-h-[300px] font-mono"
              />
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleSave}
                  disabled={status.type === "loading" || !bulkText.trim()}
                >
                  {status.type === "loading" ? "Saving..." : "Save Rates"}
                </Button>
                {status.message && (
                  <p
                    className={`text-sm ${
                      status.type === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {status.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
