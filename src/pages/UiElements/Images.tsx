import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ResponsiveImage from "../../components/custom/images/ResponsiveImage";
import TwoColumnImageGrid from "../../components/custom/images/TwoColumnImageGrid";
import ThreeColumnImageGrid from "../../components/custom/images/ThreeColumnImageGrid";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function Images() {
  return (
    <>
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />
      <PageBreadcrumb pageTitle="Images" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Responsive image">
          <ResponsiveImage />
        </ComponentCard>
        <ComponentCard title="Image in 2 Grid">
          <TwoColumnImageGrid />
        </ComponentCard>
        <ComponentCard title="Image in 3 Grid">
          <ThreeColumnImageGrid />
        </ComponentCard>
      </div>
    </>
  );
}
