import { IconGmail, IconGithub } from "~/assets/brand-icons";

export const apps = [
  {
    name: "Google",
    logo: <IconGmail />,
    connected: false,
    desc: "Connect with Google for real-time communication.",
  },
  {
    name: "Gmail",
    logo: <IconGmail />,
    connected: true,
    desc: "Access and manage Gmail messages effortlessly.",
  },
  {
    name: "GitHub",
    logo: <IconGithub />,
    connected: false,
    desc: "Streamline code management with GitHub integration.",
  },
];