import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import { FileUpload } from "@myapp/ui/components/file-upload";
import { TextInput } from "@myapp/ui/components/text-input";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import { ArrowLeft, Loader2, Lock, Pencil, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSession } from "@/auth/session-context";
import { useFileUpload } from "@/hooks/use-file-upload";
import { type RouterOutputs, trpc } from "@/lib/trpc.ts";
import { renderTag } from "@/utils/tag";
import { TagInput } from "./tag-input";

function formatDateField(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function toNullable<T extends string>(value: T | ""): T | null {
  return (value || null) as T | null;
}

function displayDateLabel(value: string): string {
  if (!value?.trim()) return "—";
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

type TagShape = { id: number; name: string; color?: string };

type ContentFormFieldsProps = {
  isEditing: boolean;
  fileID: string;
  setFileID: (v: string) => void;
  filename: string;
  setFilename: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  ownerId: string;
  setOwnerId: (v: string) => void;
  jobPosition: string;
  setJobPosition: (v: string) => void;
  lastModified: string;
  setLastModified: (v: string) => void;
  expirationDate: string;
  setExpirationDate: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  documentStatus: string;
  setDocumentStatus: (v: string) => void;
  selectedTags: TagShape[];
  setSelectedTags: (tags: TagShape[]) => void;
  employees: RouterOutputs["employee"]["list"] | undefined;
  upload: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  canEdit: boolean;
  createError: ReturnType<typeof trpc.content.create.useMutation>["error"];
  updateError: ReturnType<typeof trpc.content.update.useMutation>["error"];
  isSaving: boolean;
  onDelete: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

function ContentMetadataReadonlyTable({
  fileID,
  filename,
  url,
  ownerDisplayName,
  jobPosition,
  lastModified,
  expirationDate,
  contentType,
  documentStatus,
  selectedTags,
}: {
  fileID: string;
  filename: string;
  url: string;
  ownerDisplayName: string;
  jobPosition: string;
  lastModified: string;
  expirationDate: string;
  contentType: string;
  documentStatus: string;
  selectedTags: TagShape[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="w-[38%] bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              File ID
            </th>
            <td className="px-4 py-3 font-mono text-xs text-foreground">{fileID}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Filename
            </th>
            <td className="px-4 py-3 text-foreground">{filename || "—"}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              URL
            </th>
            <td className="max-w-0 px-4 py-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-hanover-green underline hover:text-hanover-green/90"
              >
                {url}
              </a>
            </td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Content owner
            </th>
            <td className="px-4 py-3 text-foreground">{ownerDisplayName}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Job position
            </th>
            <td className="px-4 py-3 text-foreground">{jobPosition || "—"}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Last modified
            </th>
            <td className="px-4 py-3 text-foreground">{displayDateLabel(lastModified)}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Expiration
            </th>
            <td className="px-4 py-3 text-foreground">{displayDateLabel(expirationDate)}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Content type
            </th>
            <td className="px-4 py-3 text-foreground">{contentType || "—"}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Status
            </th>
            <td className="px-4 py-3 text-foreground">{documentStatus || "—"}</td>
          </tr>
          <tr className="border-b border-border last:border-b-0">
            <th
              scope="row"
              className="bg-muted/40 px-4 py-3 text-left align-top font-medium text-muted-foreground"
            >
              Tags
            </th>
            <td className="px-4 py-3">
              {selectedTags.length === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <div className="flex flex-wrap gap-x-1 gap-y-1.5">
                  {selectedTags.map((tag) => {
                    const styles = renderTag(tag);

                    return (
                      <span
                        key={tag.id}
                        style={{
                          backgroundColor: styles.bg,
                          color: styles.text,
                        }}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80"
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ContentFormSummarySection({
  filename,
  url,
  fileID,
  ownerDisplayName,
  jobPosition,
  lastModified,
  expirationDate,
  contentType,
  documentStatus,
  selectedTags,
  isUploading,
  isSaving,
  setMetadataEditMode,
  canEdit,
  createError,
  updateError,
  mutationError,
  submitLabel,
  onDelete,
}: {
  filename: string;
  url: string;
  fileID: string;
  ownerDisplayName: string;
  jobPosition: string;
  lastModified: string;
  expirationDate: string;
  contentType: string;
  documentStatus: string;
  selectedTags: TagShape[];
  upload: (file: File) => void;
  acceptTypes: string;
  isUploading: boolean;
  uploadProgress: number;
  isSaving: boolean;
  setMetadataEditMode: (v: boolean) => void;
  canEdit: boolean;
  createError: unknown;
  updateError: unknown;
  mutationError: string;
  submitLabel: string;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Metadata
        </h2>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setMetadataEditMode(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit details
          </button>
        ) : null}
      </div>

      <ContentMetadataReadonlyTable
        fileID={fileID}
        filename={filename}
        url={url}
        ownerDisplayName={ownerDisplayName}
        jobPosition={jobPosition}
        lastModified={lastModified}
        expirationDate={expirationDate}
        contentType={contentType}
        documentStatus={documentStatus}
        selectedTags={selectedTags}
      />

      {(createError || updateError) && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      {canEdit ? (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => onDelete()}
            disabled={isSaving || isUploading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-500/90 disabled:opacity-60"
          >
            {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Content
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-hanover-green px-6 py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
          >
            {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      ) : null}
    </>
  );
}

function ContentFormDraftSection({
  isEditing,
  url,
  filename,
  upload,
  acceptTypes,
  isUploading,
  uploadProgress,
  isSaving,
}: {
  isEditing: boolean;
  url: string;
  filename: string;
  upload: (file: File) => void;
  acceptTypes: string;
  isUploading: boolean;
  uploadProgress: number;
  isSaving: boolean;
}) {
  return (
    <>
      <FileUpload
        label="Upload File"
        onFileSelect={upload}
        accept={acceptTypes}
        isUploading={isUploading}
        progress={uploadProgress}
        currentFileName={url ? filename : undefined}
        disabled={isSaving}
      />

      {url && !isEditing ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">Uploaded to:</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-hanover-green underline hover:text-hanover-green/80"
          >
            {filename || url}
          </a>
        </div>
      ) : null}

      <hr className="border-border" />
    </>
  );
}

function ContentFormMetadataSection({
  isEditing,
  fileID,
  filename,
  setFilename,
  url,
  setUrl,
  ownerId,
  setOwnerId,
  jobPosition,
  setJobPosition,
  lastModified,
  setLastModified,
  expirationDate,
  setExpirationDate,
  contentType,
  setContentType,
  documentStatus,
  setDocumentStatus,
  selectedTags,
  setSelectedTags,
  employees,
  metadataEditMode,
  setMetadataEditMode,
  createError,
  updateError,
  mutationError,
  submitLabel,
  isSaving,
  isUploading,
}: {
  isEditing: boolean;
  fileID: string;
  setFileID: (v: string) => void;
  filename: string;
  setFilename: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  ownerId: string;
  setOwnerId: (v: string) => void;
  jobPosition: string;
  setJobPosition: (v: string) => void;
  lastModified: string;
  setLastModified: (v: string) => void;
  expirationDate: string;
  setExpirationDate: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  documentStatus: string;
  setDocumentStatus: (v: string) => void;
  selectedTags: TagShape[];
  setSelectedTags: (tags: TagShape[]) => void;
  employees: ContentFormFieldsProps["employees"];
  metadataEditMode: boolean;
  setMetadataEditMode: (v: boolean) => void;
  createError: unknown;
  updateError: unknown;
  mutationError: string;
  submitLabel: string;
  isSaving: boolean;
  isUploading: boolean;
}) {
  return (
    <>
      {fileID ? <p>File ID: {fileID}</p> : null}
      <TextInput
        label="Content Name"
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
      />
      <TextInput label="URL" type="text" value={url} onChange={(e) => setUrl(e.target.value)} />

      <div>
        <label htmlFor="owner" className="mb-2 block text-sm font-semibold text-foreground">
          Content Owner
        </label>
        <select
          id="owner"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
        >
          <option value="">Unassigned</option>
          {employees?.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
              {emp.employee_code ? ` (${emp.employee_code})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="job-position" className="mb-2 block text-sm font-semibold text-foreground">
          Job Position
        </label>
        <select
          id="job-position"
          value={jobPosition}
          onChange={(e) => setJobPosition(e.target.value)}
          className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
        >
          <option value="">None</option>
          <option value="admin">Admin</option>
          <option value="business-analyst">Business Analyst</option>
          <option value="underwriter">Underwriter</option>
          <option value="actuarial-analyst">Actuarial Analyst</option>
          <option value="exl-operations">EXL Operations</option>
        </select>
      </div>
      <TextInput
        label="Last Modified"
        type="date"
        value={lastModified}
        onChange={(e) => setLastModified(e.target.value)}
      />
      <TextInput
        label="Expiration Date"
        type="date"
        value={expirationDate}
        onChange={(e) => setExpirationDate(e.target.value)}
      />

      <div>
        <label htmlFor="content-type" className="mb-2 block text-sm font-semibold text-foreground">
          Content Type
        </label>
        <select
          id="content-type"
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
        >
          <option value="">—</option>
          <option value="Reference">Reference</option>
          <option value="Workflow">Workflow</option>
        </select>
      </div>

      <div>
        <label htmlFor="status" className="mb-2 block text-sm font-semibold text-foreground">
          Status
        </label>
        <select
          id="status"
          value={documentStatus}
          onChange={(e) => setDocumentStatus(e.target.value)}
          className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
        >
          <option value="">—</option>
          <option value="Created">Created</option>
          <option value="in-progress">In Progress</option>
          <option value="Finalized">Finalized</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />

      {(createError || updateError) && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {isEditing && url && metadataEditMode ? (
          <button
            type="button"
            onClick={() => setMetadataEditMode(false)}
            className="order-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted sm:order-1"
          >
            Back to summary
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="order-1 flex flex-1 items-center justify-center gap-2 rounded-md bg-hanover-green py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60 sm:order-2"
        >
          {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </>
  );
}

const SUPPORTED_EXTENSIONS = [
  "bmp",
  "csv",
  "odt",
  "doc",
  "docx",
  "gif",
  "htm",
  "html",
  "jpg",
  "jpeg",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "tiff",
  "txt",
  "xls",
  "xlsx",
  "mp4",
  "webp",
];

const canDisplayDocument = (url: string | undefined | null): boolean => {
  if (!url) return false;

  const extension = url.split(/[#?]/)[0].split(".").pop()?.toLowerCase();
  if (!extension) return false;
  return SUPPORTED_EXTENSIONS.includes(extension);
};

function ContentFormFields({
  isEditing,
  fileID,
  setFileID,
  filename,
  setFilename,
  url,
  setUrl,
  ownerId,
  setOwnerId,
  jobPosition,
  setJobPosition,
  lastModified,
  setLastModified,
  expirationDate,
  setExpirationDate,
  contentType,
  setContentType,
  documentStatus,
  setDocumentStatus,
  selectedTags,
  setSelectedTags,
  employees,
  upload,
  isUploading,
  uploadProgress,
  uploadError,
  canEdit,
  createError,
  updateError,
  isSaving,
  onDelete,
  onSubmit,
}: ContentFormFieldsProps) {
  const [metadataEditMode, setMetadataEditMode] = useState(false);
  const showFileSummary = isEditing && Boolean(url) && !metadataEditMode;
  const ownerDisplayName =
    employees?.find((e) => e.id === ownerId)?.name ?? (ownerId ? ownerId : "Unassigned");

  const mutationError = createError?.message || updateError?.message || "Something went wrong.";
  const submitLabel = isUploading ? "Uploading..." : isEditing ? "Update Content" : "Save Content";
  const acceptTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.svg";

  useEffect(() => {
    if (!url) return;

    const observer = new MutationObserver(() => {
      const downloadBtn = document.querySelector("button.rdv-toolbar-btn[title='Download']");
      if (!downloadBtn) return;

      const newBtn = downloadBtn.cloneNode(true) as HTMLElement;
      newBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "download";
        a.click();
        URL.revokeObjectURL(blobUrl);
      });

      downloadBtn.parentNode?.replaceChild(newBtn, downloadBtn);
      observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [url, filename]);

  const docs = [{ uri: url }];
  return (
    <div className="border-t border-border/60 py-8 sm:py-10">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <Link
          to="/hero/content"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Content
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-foreground">
          {isEditing ? "Edit Content" : "New Content"}
        </h1>

        <div className="rounded-xl border border-border bg-card p-6 shadow-md sm:p-8">
          {url && canDisplayDocument(url) ? (
            <div className="mb-6 overflow-hidden rounded-lg border border-border bg-muted">
              <style>{`.rdv-txt-container { white-space: pre; font-family: monospace; }`}</style>
              <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: { disableHeader: true, disableFileName: true },
                }}
                style={{ height: "70vh", minHeight: 800, width: "100%" }}
              />
            </div>
          ) : null}
          <form className="space-y-6" onSubmit={onSubmit}>
            {showFileSummary ? (
              <ContentFormSummarySection
                filename={filename}
                url={url}
                fileID={fileID}
                ownerDisplayName={ownerDisplayName}
                jobPosition={jobPosition}
                lastModified={lastModified}
                expirationDate={expirationDate}
                contentType={contentType}
                documentStatus={documentStatus}
                selectedTags={selectedTags}
                upload={upload}
                acceptTypes={acceptTypes}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                isSaving={isSaving}
                setMetadataEditMode={setMetadataEditMode}
                canEdit={canEdit}
                createError={createError}
                updateError={updateError}
                mutationError={mutationError}
                submitLabel={submitLabel}
                onDelete={onDelete}
              />
            ) : (
              <ContentFormDraftSection
                isEditing={isEditing}
                url={url}
                filename={filename}
                upload={upload}
                acceptTypes={acceptTypes}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                isSaving={isSaving}
              />
            )}

            {uploadError && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Upload failed: {uploadError}
              </div>
            )}

            {!showFileSummary ? (
              <ContentFormMetadataSection
                isEditing={isEditing}
                fileID={fileID}
                setFileID={setFileID}
                filename={filename}
                setFilename={setFilename}
                url={url}
                setUrl={setUrl}
                ownerId={ownerId}
                setOwnerId={setOwnerId}
                jobPosition={jobPosition}
                setJobPosition={setJobPosition}
                lastModified={lastModified}
                setLastModified={setLastModified}
                expirationDate={expirationDate}
                setExpirationDate={setExpirationDate}
                contentType={contentType}
                setContentType={setContentType}
                documentStatus={documentStatus}
                setDocumentStatus={setDocumentStatus}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                employees={employees}
                metadataEditMode={metadataEditMode}
                setMetadataEditMode={setMetadataEditMode}
                createError={createError}
                updateError={updateError}
                mutationError={mutationError}
                submitLabel={submitLabel}
                isSaving={isSaving}
                isUploading={isUploading}
              />
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

function ContentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const existing = trpc.content.getById.useQuery({ fileID: id! }, { enabled: isEditing });
  const employees = trpc.employee.list.useQuery({ employeePortalOnly: true });

  const [fileID, setFileID] = useState("");
  const [filename, setFilename] = useState("");
  const [url, setUrl] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [lastModified, setLastModified] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [contentType, setContentType] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [selectedTags, setSelectedTags] = useState<{ id: number; name: string }[]>([]);
  const [askConfirmation, setAskConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<Parameters<typeof update.mutate>[0] | null>(null);
  const [operation, setOperation] = useState("");

  const handleUploadSuccess = useCallback(
    (result: { publicUrl: string; storagePath: string; fileName: string }) => {
      setFilename(result.fileName.slice(0, 100));
      setUrl(result.publicUrl);
      setLastModified(new Date().toISOString().split("T")[0]);

      if (!isEditing && !fileID) {
        setFileID(result.storagePath.slice(0, 64));
      }
      if (!isEditing && !documentStatus) {
        setDocumentStatus("Created");
      }
    },
    [isEditing, fileID, documentStatus],
  );

  const { upload, isUploading, uploadProgress, uploadError } = useFileUpload({
    bucket: "content-files",
    onSuccess: handleUploadSuccess,
  });

  useEffect(() => {
    const d = existing.data;
    if (!d) return;
    setFileID(d.fileID);
    setFilename(d.filename ?? "");
    setUrl(d.url ?? "");
    setOwnerId(d.owner_id ?? "");
    setJobPosition(d.job_position ?? "");
    setLastModified(formatDateField(d.last_modified));
    setExpirationDate(formatDateField(d.expiration_date));
    setContentType(d.content_type ?? "");
    setDocumentStatus(d.document_status ?? "");
    setSelectedTags(d.content_tags?.map((ct) => ct.tag) ?? []);
  }, [existing.data]);

  const utils = trpc.useUtils();

  const create = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      navigate("/hero/content");
    },
  });

  const update = trpc.content.update.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      utils.content.getById.invalidate({ fileID: id! });
      navigate("/hero/content");
    },
  });

  const remove = trpc.content.delete.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      navigate("/hero/content");
    },
  });

  function handleDelete() {
    setOperation("delete");
    setAskConfirmation(true);
  }

  const { session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: myAccess } = trpc.user.myAccess.useQuery();
  const userRole = myAccess?.role;

  function normalizeRole(value: string | null | undefined): string {
    return (value ?? "").toLowerCase().replace(/\s+/g, "-");
  }

  const isCheckedOut = existing.data?.is_checked_out ?? false;
  const checkedOutBy = existing.data?.checked_out_by ?? null;
  const contentJobPosition = existing.data?.job_position;
  const isCheckedOutByMe = isCheckedOut && checkedOutBy === currentUserId;
  const isLockedByOther = isCheckedOut && !isCheckedOutByMe;

  // Role-based permission: does the user's role match the content's job position?
  // This determines whether they can check out the item at all.
  const hasRoleAccess =
    userRole === "admin" ||
    !contentJobPosition?.trim() ||
    (!!userRole && normalizeRole(userRole) === normalizeRole(contentJobPosition));

  // canEdit: may modify form fields / save / delete.
  // Per spec: item must be checked out by this user first.
  // Admin bypass remains so admins can recover from bad states.
  const canEdit = !isEditing || userRole === "admin" || (hasRoleAccess && isCheckedOutByMe);

  const checkout = trpc.content.checkout.useMutation({
    onSuccess: () => {
      utils.content.getById.invalidate({ fileID: id! });
      utils.content.list.invalidate();
    },
  });

  const checkin = trpc.content.checkin.useMutation({
    onSuccess: () => {
      utils.content.getById.invalidate({ fileID: id! });
      utils.content.list.invalidate();
    },
  });

  const forceUnlock = trpc.content.forceUnlock.useMutation({
    onSuccess: () => {
      utils.content.getById.invalidate({ fileID: id! });
      utils.content.list.invalidate();
    },
  });

  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalID = fileID;
    if (!fileID) {
      finalID = url.slice(-64);
      finalID = finalID.replace(/[^a-z0-9]/gi, "");
      setFileID(finalID);
    }

    const data = {
      filename: toNullable(filename),
      url: toNullable(url),
      owner_id: toNullable(ownerId),
      job_position: toNullable(jobPosition),
      last_modified: lastModified ? new Date(lastModified) : null,
      expiration_date: expirationDate ? new Date(expirationDate) : null,
      content_type: toNullable<"Reference" | "Workflow">(contentType as "Reference" | "Workflow"),
      document_status: toNullable<"Created" | "in-progress" | "Finalized" | "Archived">(
        documentStatus as "Created" | "in-progress" | "Finalized" | "Archived",
      ),
      tagIds: selectedTags.map((t) => t.id),
    };

    if (isEditing) {
      data ? setPendingData({ fileID: finalID || id!, ...data }) : null;
      setAskConfirmation(true);
      setOperation("update");
    } else {
      create.mutate({ fileID: finalID, ...data });
    }
  }

  if (isEditing && existing.isLoading) {
    return (
      <div className="flex justify-center border-t border-border/60 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading content...</span>
      </div>
    );
  }

  const checkoutError = checkout.error || checkin.error || forceUnlock.error;

  return (
    <>
      {isEditing && (
        <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
          {!hasRoleAccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <Lock className="h-4 w-4 shrink-0" />
              You do not have permission to edit this content. Only the assigned employee type can
              make changes.
            </div>
          )}
          {hasRoleAccess && isLockedByOther && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                <Lock className="h-4 w-4" />
                This file is checked out by
                {existing.data?.checked_out_by_user?.name
                  ? ` ${existing.data.checked_out_by_user.name}`
                  : " another user"}
                . Editing is disabled.
              </div>
              {session?.user?.user_metadata?.role === "admin" && (
                <button
                  type="button"
                  onClick={() => forceUnlock.mutate({ fileID: id! })}
                  disabled={forceUnlock.isPending}
                  className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
                >
                  {forceUnlock.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                  Force Unlock
                </button>
              )}
            </div>
          )}
          {hasRoleAccess && !isLockedByOther && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isCheckedOutByMe ? (
                  <>
                    <Lock className="h-4 w-4 text-hanover-green" />
                    <span className="font-medium text-hanover-green">
                      You have this file checked out — you may now edit or delete it
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>File is available. Check it out before editing or deleting.</span>
                  </>
                )}
              </div>
              {isCheckedOutByMe ? (
                <button
                  type="button"
                  onClick={() => checkin.mutate({ fileID: id! })}
                  disabled={checkin.isPending}
                  className="inline-flex items-center gap-1.5 rounded bg-muted px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-muted/80 disabled:opacity-60"
                >
                  {checkin.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                  Check In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => checkout.mutate({ fileID: id! })}
                  disabled={checkout.isPending}
                  className="inline-flex items-center gap-1.5 rounded bg-hanover-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
                >
                  {checkout.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  Check Out
                </button>
              )}
            </div>
          )}
          {checkoutError && (
            <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {checkoutError.message}
            </div>
          )}
        </div>
      )}
      <ContentFormFields
        key={id ?? "new"}
        isEditing={isEditing}
        fileID={fileID}
        setFileID={setFileID}
        filename={filename}
        setFilename={setFilename}
        url={url}
        setUrl={setUrl}
        ownerId={ownerId}
        setOwnerId={setOwnerId}
        jobPosition={jobPosition}
        setJobPosition={setJobPosition}
        lastModified={lastModified}
        setLastModified={setLastModified}
        expirationDate={expirationDate}
        setExpirationDate={setExpirationDate}
        contentType={contentType}
        setContentType={setContentType}
        documentStatus={documentStatus}
        setDocumentStatus={setDocumentStatus}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        employees={employees.data}
        upload={upload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        canEdit={canEdit}
        createError={create.error}
        updateError={update.error}
        isSaving={isSaving}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
      />
      {askConfirmation && (
        <div className="bg-black/50 fixed inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 px-10 py-5 rounded-xl">
            <p>Are you sure you want to {operation} this content?</p>
            <br />
            <div className="flex w-full justify-between">
              <button
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                type="button"
                onClick={() => setAskConfirmation(false)}
              >
                No.
              </button>
              <button
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-hanover-green px-6 py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
                type="button"
                onClick={() => {
                  setAskConfirmation(false);
                  if (pendingData && operation === "update") update.mutate(pendingData);
                  if ((!isCheckedOut || isCheckedOutByMe) && operation === "delete")
                    remove.mutate({ fileID: id! });
                }}
              >
                Yes.
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ContentFormPage;
