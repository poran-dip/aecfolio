import { CvPreview } from "~/components/protected/students/cv/cv-preview";
import { CvSidebar } from "~/components/protected/students/cv/cv-sidebar";
import { useCv } from "~/components/protected/students/cv/use-cv";
import { Spinner } from "~/components/ui/spinner";

export default function GenerateCV() {
  const {
    loading,
    data,
    templateKey,
    setTemplateKey,
    generating,
    handleDownload,
  } = useCv();

  if (loading || !data) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      <CvSidebar
        templateKey={templateKey}
        onTemplateChange={setTemplateKey}
        onDownload={handleDownload}
        generating={generating}
      />
      <CvPreview data={data} templateKey={templateKey} />
    </div>
  );
}
