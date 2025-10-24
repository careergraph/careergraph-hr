import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserMetaCard from "@/components/UserProfile/UserMetaCard";
import UserInfoCard from "@/components/UserProfile/UserInfoCard";
import UserAddressCard from "@/components/UserProfile/UserAddressCard";
import PageMeta from "@/components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
    </>
  );
}
