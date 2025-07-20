// No "use client" here—this is a server component
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Profile – Siza Admin Notifications",
};

export default function Page() {
  return <NotificationsClient />;
}
