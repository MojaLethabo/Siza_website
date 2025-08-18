"use client";

import dynamic from "next/dynamic";

const UserProfilePage = dynamic(
  () => import("@/app/User/UserProfilePage"),
  {
    ssr: false,
    loading: () => <div className="p-6">Loading user...</div>,
  }
);

export default function Page() {
  return <UserProfilePage />;
}
