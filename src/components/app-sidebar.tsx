import { Link, useRouterState } from "@tanstack/react-router";
import { Radar, Calculator, FileText, ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Radar de Oportunidades", url: "/", icon: Radar },
  { title: "Simulação", url: "/simulacao", icon: Calculator },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const active = (u: string) => (u === "/" ? path === "/" : path.startsWith(u));
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold text-gold-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="font-display text-base font-bold leading-tight group-data-[collapsible=icon]:hidden">
            LeilãoSeguro
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={active(i.url)} tooltip={i.title} size="lg">
                    <Link to={i.url}>
                      <i.icon className="h-5 w-5" />
                      <span>{i.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
