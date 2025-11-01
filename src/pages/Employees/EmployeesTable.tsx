import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import BasicTableOne from "@/components/tables/BasicTables/BasicTableOne";

// EmployeesTable hiển thị danh sách nhân viên bằng bảng cơ bản cùng breadcrumb.

export default function EmployeesTable() {
  return (
    <>
      {/* Thiết lập metadata và breadcrumb cho trang nhân viên. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Employees" />
      <div className="space-y-6">
        {/* Bảng nhân viên hiển thị dữ liệu chi tiết. */}
        <BasicTableOne />
      </div>
    </>
  );
}
