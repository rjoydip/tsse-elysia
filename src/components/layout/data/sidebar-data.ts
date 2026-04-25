import {
  LayoutDashboard,
  ListTodo,
  HelpCircle,
  Bell,
  Package,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Users,
  MessagesSquare,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Bug,
  Lock,
  UserX,
  FileX,
  ServerOff,
  Construction,
} from "lucide-react";
import { type SidebarData } from "../types";
import { APP_NAME } from "~/config";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "tss@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: `${APP_NAME} Admin`,
      logo: Command,
      plan: "",
    },
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
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Tasks",
          url: "/dashboard/tasks",
          icon: ListTodo,
        },
        {
          title: "Apps",
          url: "/dashboard/apps",
          icon: Package,
        },
        {
          title: "Chats",
          url: "/dashboard/chats",
          badge: "3",
          icon: MessagesSquare,
        },
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
        },
      ],
    },
    {
      title: "Pages",
      items: [
        {
          title: "Errors",
          icon: Bug,
          items: [
            {
              title: "Unauthorized",
              url: "/errors/unauthorized",
              icon: Lock,
            },
            {
              title: "Forbidden",
              url: "/errors/forbidden",
              icon: UserX,
            },
            {
              title: "Not Found",
              url: "/errors/not-found",
              icon: FileX,
            },
            {
              title: "Internal Server Error",
              url: "/errors/internal-server-error",
              icon: ServerOff,
            },
            {
              title: "Maintenance Error",
              url: "/errors/maintenance-error",
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: "Other",
      items: [
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Profile",
              url: "/dashboard/settings",
              icon: UserCog,
            },
            {
              title: "Account",
              url: "/dashboard/settings/account",
              icon: Wrench,
            },
            {
              title: "Appearance",
              url: "/dashboard/settings/appearance",
              icon: Palette,
            },
            {
              title: "Notifications",
              url: "/dashboard/settings/notifications",
              icon: Bell,
            },
          ],
        },
        {
          title: "Help Center",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    },
  ],
};