import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function EmployeesTable() {
  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Employees" />
      <div className="space-y-6">
        <BasicTableOne />
      </div>
    </>
  );
}
