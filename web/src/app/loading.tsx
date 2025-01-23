import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Loading() {
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
            <div className="text-sm text-muted-foreground">
              Visit Bank Website
            </div>
          </div>
          <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-4">
            <div className="col-span-full md:col-span-2 rounded-xl bg-muted/50">
              <Card className="h-full flex flex-col justify-between">
                <CardHeader className="pb-4 lg:p-6">
                  <CardTitle>USD/LKR</CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-[200px]" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-16 w-[150px]" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-span-full md:col-span-2 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="col-span-1 rounded-xl bg-muted/50">
                  <Card className="flex flex-col lg:flex-row items-center lg:items-end justify-between h-full">
                    <CardHeader className="pb-2 lg:p-6 items-center lg:items-start">
                      <CardTitle>
                        <Skeleton className="h-4 w-[100px]" />
                      </CardTitle>
                      <CardDescription>
                        <Skeleton className="h-4 w-[150px]" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-[80px]" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            <div className="col-span-full rounded-xl bg-muted/50">
              <Card>
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                  <div className="grid flex-1 gap-1">
                    <CardTitle>
                      <Skeleton className="h-6 w-[150px]" />
                    </CardTitle>
                    <CardDescription>
                      <Skeleton className="h-4 w-[250px]" />
                    </CardDescription>
                  </div>
                  <Skeleton className="h-10 w-[160px]" />
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                  <Skeleton className="h-[250px] w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 
