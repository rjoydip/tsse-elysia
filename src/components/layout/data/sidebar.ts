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
  Shield,
  CreditCard,
} from "lucide-react";
import { type SidebarData } from "../types";
import { APP_NAME } from "~/config";

export const sidebarData: SidebarData = {
  user: {
    name: "rjoydip",
    email: "tsse@gmail.com",
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
          roles: ["manager", "cashier", "user"],
        },
        {
          title: "Apps",
          url: "/dashboard/apps",
          icon: Package,
          roles: ["superadmin", "admin", "manager"],
          disabled: true,
        },
        {
          title: "Chats",
          url: "/dashboard/chats",
          badge: "3",
          icon: MessagesSquare,
          roles: ["superadmin", "admin", "manager"],
          disabled: true,
        },
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
          roles: ["superadmin", "admin", "manager"],
        },
        {
          title: "Roles & Permissions",
          url: "/dashboard/roles",
          icon: Shield,
          roles: ["superadmin", "admin"],
        },
      ],
    },
    {
      title: "Pages",
      roles: ["superadmin", "admin"],
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
              disabled: true,
              disabledMessage: "Coming soon",
            },
            {
              title: "Billing",
              url: "#",
              icon: CreditCard,
              disabled: true,
              disabledMessage: "Coming soon",
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