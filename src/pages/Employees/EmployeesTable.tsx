import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function EmployeesTable() {
  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Employees" />
      <div className="space-y-6">
        <ComponentCard title="Employees Board">
          <div>Employees</div>
        </ComponentCard>
      </div>
    </>
  );
}
