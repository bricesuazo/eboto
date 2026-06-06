import { useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Doc } from '@eboto/backend/data-model';
import type { VoterFieldType } from '@eboto/backend/schema';

import { DashboardPending } from '~/components/dashboard-pending';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ScrollArea } from '~/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  SAMPLE_VOTER_EMAILS,
  sampleValueForType,
  validateFieldValue,
} from '~/lib/voter-fields';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/voter/import',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.voterFields.list, { electionId: election._id }),
    );
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.electionDashboardSlug} · Import voters | eBoto` },
    ],
  }),
  pendingComponent: DashboardPending,
  component: VoterImportPage,
});

interface ParsedImport {
  columns: string[];
  emailKey: string;
  rows: Record<string, string>[];
  validCount: number;
  invalidCount: number;
  invalidFieldCount: number;
  duplicateInFileCount: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const csvEscape = (v: string) =>
  /[",\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;

const downloadSampleCsv = (fields: Doc<'voterFields'>[]) => {
  const headers = ['email', ...fields.map((f) => f.name)];
  const rows = SAMPLE_VOTER_EMAILS.map((email, i) => [
    email,
    ...fields.map((f) => sampleValueForType(f.type, i)),
  ]);
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voters-sample.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function VoterImportPage() {
  const { electionDashboardSlug } = Route.useParams();
  const navigate = useNavigate();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const { data: voterFields = [] } = useQuery(
    convexQuery(api.voterFields.list, { electionId: election._id }),
  );

  const bulk = useMutation(api.voters.bulkCreate);

  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = () => {
    setParsed(null);
    setError(null);
    setFileName(null);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setParsed(null);
    setFileName(file.name);
    setParsing(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        setError('No sheets found in the file.');
        return;
      }
      const sheet = wb.Sheets[firstSheetName];
      if (!sheet) {
        setError('Could not read the first sheet.');
        return;
      }
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      });
      if (rawRows.length === 0) {
        setError('The file is empty.');
        return;
      }
      const columns = Object.keys(rawRows[0] ?? {}).filter(
        (c) => c.trim() !== '',
      );
      const emailKey =
        columns.find((c) => c.toLowerCase().trim() === 'email') ??
        columns.find((c) => c.toLowerCase().includes('email'));
      if (!emailKey) {
        setError(
          'No "email" column found. Make sure your file has a column named "email".',
        );
        return;
      }
      const fieldTypeByColumn = new Map<string, VoterFieldType>();
      for (const c of columns) {
        if (c === emailKey) continue;
        const match = voterFields.find(
          (f) => f.name.toLowerCase() === c.toLowerCase(),
        );
        if (match) fieldTypeByColumn.set(c, match.type);
      }
      const seen = new Set<string>();
      let invalid = 0;
      let invalidFields = 0;
      let dup = 0;
      const valid: Record<string, string>[] = [];
      for (const r of rawRows) {
        const normalized: Record<string, string> = {};
        for (const k of columns) {
          const cell = r[k];
          normalized[k] =
            cell == null
              ? ''
              : typeof cell === 'string'
                ? cell.trim()
                : typeof cell === 'number' || typeof cell === 'boolean'
                  ? String(cell).trim()
                  : '';
        }
        const email = (normalized[emailKey] ?? '').toLowerCase();
        if (!email || !EMAIL_RE.test(email)) {
          invalid++;
          continue;
        }
        if (seen.has(email)) {
          dup++;
          continue;
        }
        let rowFieldInvalid = false;
        for (const [col, type] of fieldTypeByColumn) {
          if (validateFieldValue(type, normalized[col] ?? '') !== null) {
            rowFieldInvalid = true;
            break;
          }
        }
        if (rowFieldInvalid) {
          invalidFields++;
          continue;
        }
        seen.add(email);
        normalized[emailKey] = email;
        valid.push(normalized);
      }
      setParsed({
        columns,
        emailKey,
        rows: valid,
        validCount: valid.length,
        invalidCount: invalid,
        invalidFieldCount: invalidFields,
        duplicateInFileCount: dup,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSubmitting(true);
    try {
      const payload = parsed.rows.map((r) => {
        const fields: Record<string, string> = {};
        for (const k of parsed.columns) {
          if (k === parsed.emailKey) continue;
          const v = r[k];
          if (v) fields[k] = v;
        }
        return {
          email: r[parsed.emailKey] ?? '',
          ...(Object.keys(fields).length > 0 ? { fields } : {}),
        };
      });
      const result = await bulk({
        electionId: election._id,
        voters: payload,
      });
      const parts = [
        `${result.added} added`,
        `${result.skipped.length} already registered`,
      ];
      if (result.domainRejected.length > 0) {
        parts.push(`${result.domainRejected.length} wrong domain`);
      }
      toast.success(parts.join(' · '));
      await navigate({
        to: '/dashboard/$electionDashboardSlug/voter',
        params: { electionDashboardSlug },
      });
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Failed')
          : 'Failed',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            render={
              <Link
                to="/dashboard/$electionDashboardSlug/voter"
                params={{ electionDashboardSlug }}
              />
            }
          >
            <ArrowLeft className="mr-1 size-3.5" />
            Back to voters
          </Button>
          <h1 className="text-2xl font-bold">Bulk import voters</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel file with an{' '}
            <span className="font-mono">email</span> column. Other columns will
            be saved as custom voter fields.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadSampleCsv(voterFields)}
        >
          <Download className="size-4" />
          Download sample
        </Button>
      </div>

      {!parsed ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Label htmlFor="voter-file">File</Label>
            <Input
              id="voter-file"
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              disabled={parsing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Download the sample, fill in your voters, and re-upload.
            </p>
            {fileName && (
              <p className="text-xs text-muted-foreground">
                {parsing ? 'Parsing' : 'Selected'}: {fileName}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">
                  {parsed.validCount} voter
                  {parsed.validCount === 1 ? '' : 's'} ready
                </span>
                {parsed.duplicateInFileCount > 0 && (
                  <span className="text-muted-foreground">
                    · {parsed.duplicateInFileCount} duplicate
                    {parsed.duplicateInFileCount === 1 ? '' : 's'} in file
                  </span>
                )}
                {parsed.invalidCount > 0 && (
                  <span className="text-muted-foreground">
                    · {parsed.invalidCount} invalid email
                    {parsed.invalidCount === 1 ? '' : 's'}
                  </span>
                )}
                {parsed.invalidFieldCount > 0 && (
                  <span className="text-muted-foreground">
                    · {parsed.invalidFieldCount} row
                    {parsed.invalidFieldCount === 1 ? '' : 's'} with invalid
                    field values
                  </span>
                )}
                <span className="text-muted-foreground">
                  · email column:{' '}
                  <span className="font-mono">{parsed.emailKey}</span>
                </span>
                {fileName && (
                  <span className="text-muted-foreground">
                    · file: <span className="font-mono">{fileName}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                  onClick={reset}
                >
                  Choose another file
                </Button>
                <Button
                  type="button"
                  disabled={submitting || parsed.validCount === 0}
                  onClick={handleSave}
                >
                  <Upload className="size-4" />
                  {submitting
                    ? 'Importing…'
                    : `Save ${parsed.validCount} voter${parsed.validCount === 1 ? '' : 's'}`}
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[480px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    {parsed.columns.map((c) => (
                      <TableHead key={c}>
                        {c}
                        {c === parsed.emailKey && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (email)
                          </span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.rows.map((r, i) => (
                    <TableRow key={i}>
                      {parsed.columns.map((c) => (
                        <TableCell key={c} className="font-mono text-xs">
                          {r[c]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
