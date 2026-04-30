import { UserRow } from "./shared/user-row";

interface SalesData {
  avatarSrc: string;
  fallback: string;
  name: string;
  email: string;
  amount: string;
}

const recentSalesData: SalesData[] = [
  {
    avatarSrc: "/avatars/01.png",
    fallback: "OM",
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
  },
  {
    avatarSrc: "/avatars/02.png",
    fallback: "JL",
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
  },
  {
    avatarSrc: "/avatars/03.png",
    fallback: "IN",
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
  },
  {
    avatarSrc: "/avatars/04.png",
    fallback: "WK",
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
  },
  {
    avatarSrc: "/avatars/05.png",
    fallback: "SD",
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
  },
];

export function RecentSales() {
  return (
    <div className="space-y-8">
      {recentSalesData.map((user, index) => (
        <UserRow
          key={index}
          avatarSrc={user.avatarSrc}
          fallback={user.fallback}
          name={user.name}
          email={user.email}
          amount={user.amount}
        />
      ))}
    </div>
  );
}