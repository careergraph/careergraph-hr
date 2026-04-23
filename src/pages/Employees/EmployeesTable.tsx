import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/custom/badge/Badge";
import BasicTableOne from "@/components/tables/BasicTables/BasicTableOne";

// EmployeesTable hiển thị danh sách nhân viên bằng bảng cơ bản cùng breadcrumb.

export default function EmployeesTable() {
  return (
    <>
      {/* Thiết lập metadata và breadcrumb cho trang nhân viên. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Employees" />
      <div className="space-y-4 md:space-y-6">
        {/* Bảng nhân viên hiển thị dữ liệu chi tiết. */}
        <BasicTableOne
          mobileCardRenderer={(order: { id: number; user: { image: string; name: string; role: string }; projectName: string; status: string; budget: string }) => (
            <div
              key={order.id}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
                <img
                  src={order.user.image}
                  className="h-10 w-10 rounded-full object-cover"
                  alt={order.user.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {order.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{order.user.role}</p>
                </div>
                <Badge
                  size="sm"
                  color={
                    order.status === "Active"
                      ? "success"
                      : order.status === "Pending"
                        ? "warning"
                        : "error"
                  }
                >
                  {order.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{order.projectName}</span>
                <span>{order.budget}</span>
              </div>
            </div>
          )}
        />
      </div>
    </>
  );
}
