import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserMetaCard from "@/components/UserProfile/UserMetaCard";
import UserInfoCard from "@/components/UserProfile/UserInfoCard";
import UserAddressCard from "@/components/UserProfile/UserAddressCard";
import PageMeta from "@/components/common/PageMeta";

// UserProfiles tổng hợp các thẻ thông tin cá nhân, meta và địa chỉ.

export default function UserProfiles() {
  return (
    <>
      {/* Metadata và breadcrumb của trang hồ sơ. */}
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="space-y-6">
          {/* Các thẻ thông tin thành phần của hồ sơ. */}
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
    </>
  );
}
