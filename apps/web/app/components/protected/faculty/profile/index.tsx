import { ProfileFields } from "~/components/protected/faculty/profile/profile-fields";
import { ProfileHeader } from "~/components/protected/faculty/profile/profile-header";
import { useFacultyProfile } from "~/components/protected/faculty/profile/use-faculty-profile";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";

export default function FacultyProfile() {
  const { data, loading } = useFacultyProfile();

  if (loading || !data) return <Spinner />;

  return (
    <div>
      <Card className="p-5">
        <ProfileHeader data={data} />
        <Separator />
        <ProfileFields data={data} />
      </Card>
    </div>
  );
}
