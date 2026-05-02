import DocViewer, { DocViewerRenderers } from "@iamjariwala/react-doc-viewer";
import { FileUpload } from "@myapp/ui/components/file-upload";
import { TextInput } from "@myapp/ui/components/text-input";
import "@iamjariwala/react-doc-viewer/dist/index.css";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  Link2,
  Loader2,
  Lock,
  Pencil,
  Search,
  Sparkles,
  Tag as TagIcon,
  Unlock,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
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

function todayDateInputValue(): string {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split("T")[0];
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
  nextReviewDate: string;
  setNextReviewDate: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  documentStatus: string;
  setDocumentStatus: (v: string) => void;
  selectedTags: TagShape[];
  setSelectedTags: (tags: TagShape[]) => void;
  canCreateTags: boolean;
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
  extractedText?: string | null;
};

// Walk DOM text nodes and wrap matches in <mark> without touching React-managed nodes.
function highlightTextNodes(root: Element, re: RegExp) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const matches: [Text, string][] = [];

  let node: Node | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard TreeWalker pattern
  while ((node = walker.nextNode())) {
    const text = (node as Text).textContent ?? "";
    if (re.test(text)) matches.push([node as Text, text]);
    re.lastIndex = 0;
  }

  for (const [textNode, raw] of matches) {
    const span = document.createElement("span");
    span.innerHTML = raw.replace(
      re,
      '<mark style="background:#fef08a;border-radius:2px;padding:0 1px">$1</mark>',
    );
    re.lastIndex = 0;
    textNode.parentNode?.replaceChild(span, textNode);
  }
}

function HighlightedExcerpt({ text, query }: { text: string; query: string }) {
  const CONTEXT = 120;
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  if (!queryLower) return null;

  // Find the first occurrence to anchor the excerpt.
  const idx = lower.indexOf(queryLower);
  if (idx === -1) return null;

  const start = Math.max(0, idx - CONTEXT);
  const end = Math.min(text.length, idx + queryLower.length + CONTEXT);
  const excerpt = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");

  // Split excerpt on all occurrences of the query word (case-insensitive) for highlighting.
  const escapedQuery = queryLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts: Array<{ key: string; text: string; isMatch: boolean }> = [];
  let lastIndex = 0;
  for (const match of excerpt.matchAll(new RegExp(escapedQuery, "gi"))) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push({
        key: `text-${lastIndex}`,
        text: excerpt.slice(lastIndex, matchIndex),
        isMatch: false,
      });
    }
    parts.push({
      key: `match-${matchIndex}`,
      text: match[0],
      isMatch: true,
    });
    lastIndex = matchIndex + match[0].length;
  }
  if (lastIndex < excerpt.length) {
    parts.push({
      key: `text-${lastIndex}`,
      text: excerpt.slice(lastIndex),
      isMatch: false,
    });
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-blue-50/30 px-5 py-4 text-sm shadow-sm shadow-blue-100/30 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-blue-950/10">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
          Matched in document content
        </p>
      </div>
      <p className="leading-relaxed text-foreground/90">
        {parts.map((part) =>
          part.isMatch ? (
            <mark
              key={part.key}
              className="rounded bg-yellow-200/80 px-0.5 text-foreground dark:bg-yellow-500/30"
            >
              {part.text}
            </mark>
          ) : (
            part.text
          ),
        )}
      </p>
    </div>
  );
}

function MetadataRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="group/row border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20">
      <th
        scope="row"
        className="w-[38%] bg-muted/30 px-4 py-3 text-left align-top text-[12.5px] font-medium text-muted-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-muted-foreground/70">{icon}</span>
          {label}
        </span>
      </th>
      <td className="px-4 py-3 align-top text-sm text-foreground">{children}</td>
    </tr>
  );
}

function ContentMetadataReadonlyTable({
  fileID,
  filename,
  url,
  ownerDisplayName,
  jobPosition,
  lastModified,
  expirationDate,
  nextReviewDate,
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
  nextReviewDate: string;
  contentType: string;
  documentStatus: string;
  selectedTags: TagShape[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm shadow-black/[0.02]">
      <table className="w-full text-sm">
        <tbody>
          <MetadataRow icon={<Hash className="h-3.5 w-3.5" aria-hidden />} label="File ID">
            <span className="font-mono text-xs text-foreground/90">{fileID}</span>
          </MetadataRow>
          <MetadataRow icon={<FileText className="h-3.5 w-3.5" aria-hidden />} label="Filename">
            {filename || <span className="text-muted-foreground/70">—</span>}
          </MetadataRow>
          <MetadataRow icon={<Link2 className="h-3.5 w-3.5" aria-hidden />} label="URL">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-hanover-green underline-offset-4 transition-colors hover:text-hanover-green/80 hover:underline"
            >
              {url}
            </a>
          </MetadataRow>
          <MetadataRow icon={<User className="h-3.5 w-3.5" aria-hidden />} label="Content owner">
            {ownerDisplayName}
          </MetadataRow>
          <MetadataRow icon={<User className="h-3.5 w-3.5" aria-hidden />} label="Job position">
            {jobPosition || <span className="text-muted-foreground/70">—</span>}
          </MetadataRow>
          <MetadataRow
            icon={<Calendar className="h-3.5 w-3.5" aria-hidden />}
            label="Last modified"
          >
            {displayDateLabel(lastModified)}
          </MetadataRow>
          <MetadataRow icon={<Calendar className="h-3.5 w-3.5" aria-hidden />} label="Expiration">
            {displayDateLabel(expirationDate)}
          </MetadataRow>
          <MetadataRow
            icon={<Calendar className="h-3.5 w-3.5" aria-hidden />}
            label="Next review date"
          >
            {displayDateLabel(nextReviewDate)}
          </MetadataRow>
          <MetadataRow icon={<FileText className="h-3.5 w-3.5" aria-hidden />} label="Content type">
            {contentType ? (
              <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {contentType}
              </span>
            ) : (
              <span className="text-muted-foreground/70">—</span>
            )}
          </MetadataRow>
          <MetadataRow
            icon={
              <span
                className="inline-block h-2 w-2 rounded-full bg-current opacity-60"
                aria-hidden
              />
            }
            label="Status"
          >
            {documentStatus || <span className="text-muted-foreground/70">—</span>}
          </MetadataRow>
          <MetadataRow icon={<TagIcon className="h-3.5 w-3.5" aria-hidden />} label="Tags">
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground/70">—</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => {
                  const styles = renderTag(tag);

                  return (
                    <span
                      key={tag.id}
                      style={{
                        backgroundColor: styles.bg,
                        color: styles.text,
                      }}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ring-black/[0.04] transition-all hover:opacity-90"
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}
          </MetadataRow>
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
  nextReviewDate,
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
  onDelete,
}: {
  filename: string;
  url: string;
  fileID: string;
  ownerDisplayName: string;
  jobPosition: string;
  lastModified: string;
  expirationDate: string;
  nextReviewDate: string;
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
        nextReviewDate={nextReviewDate}
        contentType={contentType}
        documentStatus={documentStatus}
        selectedTags={selectedTags}
      />

      {(createError || updateError) && (
        <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mutationError}
        </div>
      )}
      {canEdit && (
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => onDelete()}
            disabled={isSaving || isUploading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-500/90 disabled:opacity-0"
          >
            {(isSaving || isUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Content
          </button>
        </div>
      )}
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
  nextReviewDate,
  setNextReviewDate,
  contentType,
  setContentType,
  documentStatus,
  setDocumentStatus,
  selectedTags,
  setSelectedTags,
  canCreateTags,
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
  nextReviewDate: string;
  setNextReviewDate: (v: string) => void;
  contentType: string;
  setContentType: (v: string) => void;
  documentStatus: string;
  setDocumentStatus: (v: string) => void;
  selectedTags: TagShape[];
  setSelectedTags: (tags: TagShape[]) => void;
  canCreateTags: boolean;
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
      <TextInput
        label="Next Review Date"
        type="date"
        value={nextReviewDate}
        onChange={(e) => setNextReviewDate(e.target.value)}
        min={todayDateInputValue()}
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

      <TagInput
        selectedTags={selectedTags}
        onChange={setSelectedTags}
        canCreateTags={canCreateTags}
      />

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


function DocViewerWithMagnifier({
                                  docs,
                                  fileID,
                                  filename,
                                  url,
                                  trackDownload,
                                }: {
  docs: { uri: string }[];
  fileID: string;
  filename: string;
  url: string;
  trackDownload: ReturnType<typeof trpc.content.trackDownload.useMutation>;
}) {
  const ZOOM_LEVELS = [1, 1.5, 2, 3];
  const [magnifyMode, setMagnifyMode] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0, originX: 0, originY: 0, didDrag: false });
  const scale = ZOOM_LEVELS[zoomIdx];

  function reset() {
    setZoomIdx(0);
    setTranslate({ x: 0, y: 0 });
  }

  function toggleMagnify() {
    if (magnifyMode) reset();
    setMagnifyMode((v) => !v);
  }

  function onClick(e: React.MouseEvent) {
    if (!magnifyMode) return;
    if (panStart.current.didDrag) {
      panStart.current.didDrag = false;
      return;
    }
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextIdx = (zoomIdx + 1) % ZOOM_LEVELS.length;
    const nextScale = ZOOM_LEVELS[nextIdx];
    if (nextScale === 1) {
      setTranslate({ x: 0, y: 0 });
    } else {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const ratio = nextScale / scale;
      setTranslate({
        x: clickX - (clickX - translate.x) * ratio,
        y: clickY - (clickY - translate.y) * ratio,
      });
    }
    setZoomIdx(nextIdx);
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!magnifyMode || scale === 1) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      originX: translate.x,
      originY: translate.y,
      didDrag: false,
    };
  }

  useEffect(() => {
    if (!isPanning) return;
    function onMove(e: MouseEvent) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panStart.current.didDrag = true;
      setTranslate({
        x: panStart.current.originX + dx,
        y: panStart.current.originY + dy,
      });
    }
    function onUp() {
      setIsPanning(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  let cursor = "default";
  if (magnifyMode) {
    if (isPanning) cursor = "grabbing";
    else if (scale > 1) cursor = "grab";
    else cursor = "zoom-in";
  }

  return (
      <div className="mx-auto mb-6 max-w-4xl overflow-hidden rounded-lg border border-gray-300 bg-muted text-black shadow-lg">
        <style>{`.rdv-txt-container { white-space: pre; font-family: monospace; }
    button.rdv-toolbar-btn[title='Download'],
    button.rdv-toolbar-btn[title='Print'],
    #pdf-download,
    #pdf-print { display: none !important; }`}</style>

        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <button
              type="button"
              onClick={toggleMagnify}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  magnifyMode
                      ? "bg-hanover-green text-white hover:bg-hanover-green/90"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <Search className="h-3.5 w-3.5" />
            Magnifier
          </button>
          {scale > 1 && (
              <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {scale.toFixed(1)}×
            </span>
                <button
                    type="button"
                    onClick={reset}
                    className="text-muted-foreground hover:text-foreground"
                    title="Reset zoom"
                >
                  <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                    <title>Reset</title>
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>
          )}
        </div>

        <div
            ref={areaRef}
            onClick={onClick}
            onMouseDown={onMouseDown}
            style={{ cursor, overflow: "hidden", position: "relative", height: "80vh", minHeight: 500 }}
        >
          <div
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: "0 0",
                transition: isPanning ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                width: "100%",
                height: "100%",
              }}
          >
            <DocViewer
                documents={docs}
                pluginRenderers={DocViewerRenderers}
                config={{
                  header: { disableHeader: true, disableFileName: true },
                }}
                style={{
                  height: "100%",
                  width: "100%",
                  pointerEvents: magnifyMode ? "none" : "auto",
                }}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-background px-4 py-2.5">
          <button
              type="button"
              onClick={async () => {
                trackDownload.mutate({ fileID });
                const res = await fetch(url);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = filename || "download";
                a.click();
                URL.revokeObjectURL(blobUrl);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-hanover-green px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-hanover-green/90 active:scale-95"
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
              <title>Download</title>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      </div>
  );
}

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
  nextReviewDate,
  setNextReviewDate,
  contentType,
  setContentType,
  documentStatus,
  setDocumentStatus,
  selectedTags,
  setSelectedTags,
  canCreateTags,
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
  extractedText,
}: ContentFormFieldsProps) {
  const [metadataEditMode, setMetadataEditMode] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const trackDownload = trpc.content.trackDownload.useMutation();
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
        trackDownload.mutate({ fileID });
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
  }, [url, filename, fileID, trackDownload.mutate]);

  // Highlight search terms inside the DocViewer once it finishes rendering.
  useEffect(() => {
    if (!searchQuery || !url) return;

    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const queryRe = new RegExp(`(${escaped})`, "gi");

    function applyHighlights() {
      // ── Plain text / CSV ────────────────────────────────────────────────
      const txtContainer = document.querySelector(".rdv-txt-container");
      if (txtContainer && (ext === "txt" || ext === "csv")) {
        const raw = txtContainer.textContent ?? "";
        if (!raw) return false;
        txtContainer.innerHTML = raw.replace(
          queryRe,
          '<mark style="background:#fef08a;border-radius:2px;padding:0 1px">$1</mark>',
        );
        txtContainer.querySelector("mark")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }

      // ── DOCX / DOC ──────────────────────────────────────────────────────
      const msdocContainer = document.querySelector(".rdv-msdoc-content");
      if (msdocContainer && (ext === "docx" || ext === "doc")) {
        highlightTextNodes(msdocContainer, queryRe);
        msdocContainer
          .querySelector("mark")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }

      // ── PDF text layer ──────────────────────────────────────────────────
      // PDF.js renders an invisible text layer (.textLayer) on top of the canvas.
      // We tint matching spans so the highlight aligns with the visible glyphs.
      if (ext === "pdf") {
        const textLayerSpans = document.querySelectorAll<HTMLElement>(
          ".textLayer span, .text-layer span",
        );
        if (textLayerSpans.length === 0) return false;

        let firstMatch: HTMLElement | null = null;
        for (const span of textLayerSpans) {
          if (queryRe.test(span.textContent ?? "")) {
            span.style.backgroundColor = "#fef08a";
            span.style.borderRadius = "2px";
            if (!firstMatch) firstMatch = span;
          }
          queryRe.lastIndex = 0; // reset stateful regex after each test
        }
        firstMatch?.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }

      return false;
    }

    // Retry until the DocViewer finishes rendering, then stop.
    const observer = new MutationObserver(() => {
      if (applyHighlights()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [searchQuery, url, filename]);

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
          {searchQuery && extractedText && (
            <HighlightedExcerpt text={extractedText} query={searchQuery} />
          )}
          {url && canDisplayDocument(url) ? (
              <DocViewerWithMagnifier
                  docs={docs}
                  fileID={fileID}
                  filename={filename}
                  url={url}
                  trackDownload={trackDownload}
              />
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
                nextReviewDate={nextReviewDate}
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
                nextReviewDate={nextReviewDate}
                setNextReviewDate={setNextReviewDate}
                contentType={contentType}
                setContentType={setContentType}
                documentStatus={documentStatus}
                setDocumentStatus={setDocumentStatus}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                canCreateTags={canCreateTags}
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
  const trackedViewIdRef = useRef<string | null>(null);

  const existing = trpc.content.getById.useQuery({ fileID: id! }, { enabled: isEditing });
  const employees = trpc.employee.list.useQuery({ employeePortalOnly: true });

  const [fileID, setFileID] = useState("");
  const [filename, setFilename] = useState("");
  const [url, setUrl] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [lastModified, setLastModified] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [contentType, setContentType] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [selectedTags, setSelectedTags] = useState<{ id: number; name: string }[]>([]);
  const [askConfirmation, setAskConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<Parameters<typeof update.mutate>[0] | null>(null);
  const [operation, setOperation] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState("");

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

  const handleReviewReminder = useCallback(
    (next_review_date: string | Date | null, expiration_date: string | Date | null): void => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (next_review_date) {
        const review = new Date(next_review_date);
        review.setHours(0, 0, 0, 0);
        if (review <= today) {
          setReminderText("Review date passed. Review needed.");
          setShowReminder(true);
          return;
        }
      }

      if (expiration_date) {
        const expiration = new Date(expiration_date);
        expiration.setHours(0, 0, 0, 0);
        if (expiration <= today) {
          setReminderText("Expired content. Review needed.");
          setShowReminder(true);
        }
      }
    },
    [],
  );

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
    setNextReviewDate(formatDateField(d.next_review_date));
    setContentType(d.content_type ?? "");
    setDocumentStatus(d.document_status ?? "");
    setSelectedTags(d.content_tags?.map((ct) => ct.tag) ?? []);
    handleReviewReminder(d.next_review_date, d.expiration_date);
  }, [existing.data, handleReviewReminder]);

  const utils = trpc.useUtils();
  const trackView = trpc.content.trackView.useMutation({
    onSuccess: () => {
      if (!id) return;
      utils.content.getById.invalidate({ fileID: id });
      utils.content.list.invalidate();
    },
  });

  useEffect(() => {
    if (!isEditing || !existing.data?.fileID) return;
    if (trackedViewIdRef.current === existing.data.fileID) return;

    trackedViewIdRef.current = existing.data.fileID;
    trackView.mutate({ fileID: existing.data.fileID });
  }, [existing.data?.fileID, isEditing, trackView]);

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

    if (nextReviewDate && nextReviewDate < todayDateInputValue()) {
      alert("Next review date cannot be in the past");
      return;
    }

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
      next_review_date: nextReviewDate ? new Date(nextReviewDate) : null,
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
      {showReminder && (
        <div className="fixed bottom-2 right-2 gap-2 rounded-lg border border-destructive/40 bg-destructive/10 py-5 pl-10 pr-8 text-sm font-medium text-destructive">
          <div className="absolute right-1 top-1">
            <button
              type="button"
              className="hover:bg-destructive/30 rounded-md"
              onClick={() => setShowReminder(false)}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-row">
            <div className="absolute left-1">
              <AlertTriangle />
            </div>
            <div>
              <p className="text-lg">{reminderText}</p>
            </div>
          </div>
        </div>
      )}
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
              {userRole === "admin" && (
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
        nextReviewDate={nextReviewDate}
        setNextReviewDate={setNextReviewDate}
        contentType={contentType}
        setContentType={setContentType}
        documentStatus={documentStatus}
        setDocumentStatus={setDocumentStatus}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        canCreateTags={userRole === "admin"}
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
        extractedText={existing.data?.extracted_text}
      />
      {askConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white px-10 py-5 dark:bg-zinc-800">
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
                  const data = existing.data;
                  if (data) handleReviewReminder(data.next_review_date, data.expiration_date);
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
