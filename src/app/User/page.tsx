import { Suspense } from "react";
import UserProfilePage from "@/app/User/UserProfilePage";

export default function Page() {   // Rename this function to 'Page' or 'UserPage'
  return (
    <Suspense fallback={<div className="p-6">Loading user...</div>}>
      <UserProfilePage />
    </Suspense>
  );
}
