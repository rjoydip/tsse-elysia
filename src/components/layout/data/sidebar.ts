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
          permission: "dashboard:read",
        },
        {
          title: "Tasks",
          url: "/dashboard/tasks",
          icon: ListTodo,
          roles: ["user", "manager", "cashier"],
        },
        {
          title: "Apps",
          url: "/dashboard/apps",
          icon: Package,
          permission: "apps:read",
          disabled: true,
        },
        {
          title: "Chats",
          url: "/dashboard/chats",
          badge: "0",
          icon: MessagesSquare,
          permission: "chats:read",
          disabled: true,
        },
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
          permission: "users:read",
        },
        {
          title: "Roles & Permissions",
          url: "/dashboard/roles",
          icon: Shield,
          permission: "settings:write",
        },
      ],
    },
    {
      title: "Pages",
      permission: "settings:read",
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
              permission: "settings:read",
            },
            {
              title: "Account",
              url: "/dashboard/settings/account",
              icon: Wrench,
              permission: "settings:read",
            },
            {
              title: "Appearance",
              url: "/dashboard/settings/appearance",
              icon: Palette,
              permission: "settings:read",
            },
            {
              title: "Notifications",
              url: "/dashboard/settings/notifications",
              icon: Bell,
              permission: "settings:read",
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