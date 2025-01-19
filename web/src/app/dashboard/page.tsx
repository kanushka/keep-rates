import { SummaryChart } from "@/components/summary-chart";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";

export default function Page() {
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
                  <BreadcrumbLink href="#">KeepRates</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Commercial Bank</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col items-start justify-between gap-1 mb-4">
            <div className="text-2xl font-bold">
              Commercial Bank | Sri Lanka
            </div>
            <Link
              href="https://www.combank.lk/rates-tariff#exchange-rates"
              className="text-sm text-muted-foreground"
            >
              Visit Bank Website
            </Link>
          </div>
          <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-4">
            <div className="col-span-full md:col-span-2 rounded-xl bg-muted/50">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader className="pb-4 lg:p-6">
                  <CardTitle>USD/LKR</CardTitle>
                  <CardDescription>Last updated 10 minutes ago</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-sm text-muted-foreground">
                      +0.01 (0.01%)
                    </div>
                    <div className="text-6xl font-bold">135.00</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-span-full md:col-span-2 grid grid-cols-2 gap-4">
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6">
                    <CardTitle>Overall Change</CardTitle>
                    <CardDescription>In the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">135.00</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6 items-center lg:items-start">
                    <CardTitle>Highest Rate</CardTitle>
                    <CardDescription>In the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">135.00</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6">
                    <CardTitle>Overall Change</CardTitle>
                    <CardDescription>In the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">135.00</div>
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1 rounded-xl bg-muted/50">
                <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                  <CardHeader className="pb-2 lg:p-6">
                    <CardTitle>Lowest Rate</CardTitle>
                    <CardDescription>In the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">135.00</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="col-span-full rounded-xl bg-muted/50">
              <SummaryChart />
            </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
