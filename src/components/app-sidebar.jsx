"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  DownloadIcon,
  Frame,
  GalleryVerticalEnd,
  Map,
  OctagonAlertIcon,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { StatusBanner } from "@/context/OfflineStatusContext"
import { Collapsible, CollapsibleTrigger } from "./ui/collapsible"
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant"
import { cn } from "@/lib/utils"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Chatbot",
      url: "/consult",
      icon: Bot,
      items: [
        {
          title: "Consult",
          url: "/consult",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const { progress, isModelCached, downloadModel } = useVoiceAssistant();

const [isModelDownloaded, setIsModelDownloaded] = React.useState(false);

  React.useEffect(() => {
    const checkModel = async () => {
      const cached = await isModelCached();
      setIsModelDownloaded(cached);
    };
    checkModel();
  }, [isModelCached]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-t-2">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <SidebarGroup>
          <SidebarGroupLabel>Offline Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                key="status"
                asChild
                className="group/collapsible">
                <SidebarMenuItem >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild onClick={downloadModel}>
                      <div className={`border`}>
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        {(progress.text && progress.percent !== 100)
                          ? `'Downloading... (${progress.percent}%)`
                          : "Download/Setup Offline Mode"}
                      </div>
                    </SidebarMenuButton>

                  </CollapsibleTrigger>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>

        {(progress.text && progress.percent !== 100) && (
          <div className="text-xs animate-fade-in truncate overflow-ellipsis">
            {progress.text || "Loading..."}
          </div>
        )}
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar >
  );
}
