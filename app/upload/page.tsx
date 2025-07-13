// app/admin/upload/page.tsx (or pages/admin/upload.tsx if using pages/)
import CSVUploader from "@/app/firebase/uploadContent";

export default function UploadPage() {
  return (
    <div className="max-w-xl mx-auto py-10">
      <CSVUploader />
    </div>
  );
}
