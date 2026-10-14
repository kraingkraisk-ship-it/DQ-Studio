# Data Quality Studio — Worklog

Project: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui (New York) + zustand + recharts + sonner.

Key architecture decisions (Task 1):
- **Single route `/`**: sandbox only exposes `/`, so the app uses internal hash-based view routing (`#/datasets?ds=id`) managed by `useAppStore` (zustand). No other Next.js routes.
- **Session storage**: all user data lives in zustand persisted to `sessionStorage` (`useDataStore`). Prototype requirement — warn user that data is lost on refresh/close. Demo/sample data seeded on first load.
- **i18n**: custom lightweight TH/EN provider at `src/lib/i18n`. Translation files split per feature to allow parallel work: `translations/common.ts` (shell+shared), `translations/data.ts` (Data views), `translations/dq.ts` (Rule-based DQ views), `translations/ml.ts` (ML views). `src/lib/i18n/index.tsx` merges them.
- **Views**: all pages live in `src/components/dq/views/*View.tsx` and are switched by `AppShell`. Subagents fill stub files.
- **Simulated processing**: rule check runs / ML training are clearly labeled "Demo / จำลอง". No real rule engine or ML in this round.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Foundation — i18n, stores, utils, mock data, shared components, app shell, page.tsx

Work Log:
- Created i18n provider + TH/EN dictionaries (common; stubs data/dq/ml for subagents)
- Created `useAppStore` (view routing via hash) and `useDataStore` (datasets/rules/runs/ML, sessionStorage persist, seeded demo data)
- Created utils: CSV/JSON parsing (nested JSON rejected), type detection, export CSV/JSON download, format helpers, seeded PRNG
- Created mock/simulators: `simulateCheckRun`, historical DQ runs, ML training/check simulators
- Created shared components: AppShell (sidebar+header+breadcrumb+footer), PageHeader, DataTable (search/filter/sort/pagination), StatusBadge, DemoBadge, StatCard, Empty/Loading/Error states, chart components (recharts wrappers)
- Created `src/app/page.tsx` with LanguageProvider + AppShell + view switcher and stub views

Stage Summary:
- Foundation APIs for subagents documented in this file (see APIs below). Views are stubs to be replaced by Tasks 2-a/2-b/2-c.

## APIs for view agents

### Navigation (`useAppStore` from `@/lib/store/use-app-store`)
- `view: ViewId` — one of: overview, datasets, import-data, dataset-detail, rule-management, run-quality-check, check-results, quality-dashboard, reports-export, training-workspace, training-results, human-review, model-registry, ml-quality-check, ml-check-results, ml-dashboard, ml-reports-export
- `params: Record<string,string>` (datasetId, runId, modelId, mlRunId, mlCheckId…)
- `navigate(view, params?)` — switch view + update hash
- `setParam(key, value)`

### Data (`useDataStore` from `@/lib/store/use-data-store`)
- Datasets: `datasets: Dataset[]`, `addDataset`, `deleteDataset`, `getDataset(id)` selector helper `useDataset(id)`
- Rules: `rules: Rule[]`, `addRule`, `updateRule`, `deleteRule`, `toggleRule`
- Check runs: `checkRuns: CheckRun[]`, `addCheckRun`, `deleteCheckRun`
- ML: `trainingRuns`, `addTrainingRun`, `updateTrainingRun`, `models`, `addModel`, `updateModel`, `mlCheckRuns`, `addMlCheckRun`, `reviews`, `setReview`
- `resetAll()` — restore seeded demo data
- Types in `@/lib/types` (Dataset, ColumnInfo, Rule, CheckRun, RuleResult, Issue, TrainingRun, MlModel, MlCheckRun…)

### i18n (`useI18n` from `@/lib/i18n`)
- `const { t, lang, setLang } = useI18n()`; `t('key.path')`, nested dot keys; translations per feature file in `src/lib/i18n/translations/{data,dq,ml}.ts` (agents edit ONLY their own file, structure: `export const xTranslations = { en: {...}, th: {...} }`)

### Shared components (`@/components/dq/*`)
- `<PageHeader title description actions badge />`
- `<DataTable columns data getRowId searchKeys filters pageSize onRowClick emptyTitle emptyDescription loading />` (Column: `{ key, header, render?, sortValue?, align?, className?, hideBelow? }`)
- `<StatusBadge variant label icon? />` variants: success|warning|destructive|info|neutral|draft|outline
- `<DemoBadge />`, `<StatCard label value sublabel icon variant? />`
- `<EmptyState icon? title description action? />`, `<LoadingState label? />`, `<ErrorState title description onRetry? />`
- Charts: `<PassRateAreaChart data />`, `<TrendLineChart data />`, `<DimensionBarChart data />`, `<StatusDonutChart segments centerValue />`
- `formatDate(iso, lang)`, `formatNumber`, `formatBytes` from `@/lib/utils/format`
- Export helpers: `downloadCsv`, `downloadJson`, `rowsToCsv` from `@/lib/utils/export`
- Toast: `useToast` from `@/hooks/use-toast` (shadcn) or `toast` from sonner

---
Task ID: 1-b
Agent: main (Z.ai Code)
Task: Verify foundation compiles

Work Log:
- Fixed missing import buildDemoDatasets in use-data-store
- Rewrote stub views with correct export names
- Page GET / returns 200, eslint clean, theme colors set to teal/emerald

Stage Summary:
- Foundation ready. Subagents may now replace stub views + fill translation files (data.ts / dq.ts / ml.ts). Dev server is RUNNING (port 3000) — do not start another.
---
Task ID: 2-a
Agent: general-purpose
Task: Data views (Overview, Datasets, Import Data, Dataset Detail)

Work Log:
- Read foundation APIs (types, i18n, stores, import/export/format utils, shared dq components, page.tsx router, use-toast) before writing any code
- Filled `src/lib/i18n/translations/data.ts` with the full `data.*` namespace in BOTH en and th (Thai-first copy; all 4 views use t('data.*') plus existing common keys)
- Implemented `overview-view.tsx`: PageHeader+DemoBadge, 4 StatCards (datasets/rules/checkRuns/models with Database/ListChecks/ClipboardCheck/Boxes), quick-links grid → import-data / rule-management / run-quality-check / ml-quality-check, recent 3 checkRuns (startedAt desc) with pass-rate StatusBadge thresholds (≥90 success / ≥70 warning / else destructive) + DemoBadge + click → check-results, DimensionBarChart of avg passRate per dimension (percentScale + formatPercent), "what works / demo only" card (CheckCircle2 / CircleOff)
- Implemented `datasets-view.tsx`: DataTable over datasets (name cell with file-type icon + DemoBadge, fileType StatusBadge info/neutral, rowCount/columnCount/importedAt with hideBelow sm/md, status badge, Eye/Trash2 actions with stopPropagation), searchKeys ['name'], fileType filter, row click → dataset-detail, AlertDialog delete confirm (t('confirmDelete.*') with dataset name) → deleteDataset + toast, EmptyState → import-data when empty
- Implemented `import-data-view.tsx`: amber sessionWarning Alert, dashed dropzone (drag&drop + hidden input .csv,.json + keyboard-focusable button), MAX_FILE_SIZE pre-check with formatBytes limit, FileReader.readAsText → 600ms validating LoadingState → parseByFileName; file info box (FileText/Braces icon, size, detected type, CircleCheck/CircleX + text status), full error mapping via data.import.errors.* (nested JSON rejected, never silently converted), short_rows amber warning with {count}, required dataset-name Input (defaults to filename w/o extension, inline error on submit), preview card (column chips with columnType + null counts, Table preview 5 rows × 8 cols in max-h-64 overflow-auto scrollbar-thin), Import (disabled until parsed; DisabledHint shown) → build Dataset (uid('ds'), status ready, isDemo false) → addDataset + toast → navigate dataset-detail; Reset clears everything
- Implemented `dataset-detail-view.tsx`: ErrorState + back button when datasetId not found, PageHeader with DemoBadge + "fileType · importedAt" description, actions Export CSV/JSON (downloadCsv/downloadJson + timestampName + toast), Run Quality Check → run-quality-check, Use in ML → training-workspace, StatCards (rows/columns/size/status), Tabs preview|columns: dynamic DataTable from dataset.columns (cellPreview 30, hideBelow md/lg for idx≥4/≥6, pageSize 10, search on first 2 columns, max-h-96, stable __rowId) and column profile table (type Badge, nullCount/uniqueCount) + typeNote, danger zone Card with destructive AlertDialog → deleteDataset + toast → navigate datasets
- Verified: `bunx eslint` on all 5 files → 0 problems; `tsc --noEmit` → 0 errors in src/ (pre-existing errors only in examples/ and skills/, untouched)

Stage Summary:
- All 4 data views are functional: overview stats/links/runs/chart, dataset list with search/filter/delete, robust CSV/JSON import with validation + preview flow, and dataset detail with preview/columns tabs + exports + delete.
- Key decisions: passRate treated as 0–1 fraction (matches simulateCheckRun) formatted with formatPercent; delete confirms reuse common `confirmDelete.*`; extra import error key `read_failed` added for FileReader failure; preview rows get a synthetic `__rowId` for stable DataTable keys; icon-only buttons all have aria-labels; no blue/indigo colors (teal/emerald/amber/red/violet only).
- i18n namespaces added (all under `data.*`, en+th):
  - `data.overview.*` (description, stat*, quickLinks*, link*+Desc, recent*, passRateLabel, snapshot*, worksTitle/worksHeading/demoTitle, work* ×6, demo* ×5)
  - `data.datasets.*` (description, importNew, filterType, colName/colType/colRows/colColumns/colImported/colStatus, deleted, emptyTitle/emptyDescription)
  - `data.import.*` (description, dropTitle/dropHint/dropMax, validating, fileTooLarge, fileLabel/sizeLabel/typeLabel, statusOk/statusError, errorTitle, errors.* {file_too_large, unsupported_type, empty_file, csv_no_header, csv_parse_error, json_invalid, json_not_array, json_not_objects, json_nested, no_columns, no_rows, read_failed}, shortRowsWarning, nameLabel/namePlaceholder/nameRequired, previewTitle/previewDescription, nullCount, disabledHint, successTitle/successDescription)
  - `data.detail.*` (notFoundTitle/notFoundDescription/backToDatasets, statRows/statColumns/statSize/statStatus, tabPreview/tabColumns, previewDescription/columnsDescription, colName/colType/colNull/colUnique, typeNote, runCheck/useInMl, exportStarted, dangerTitle/dangerDescription/deleteBtn/deleted)
  - Common keys reused: nav.*, actions.*, status.*, fileType.*, columnType.*, dimension.*, confirmDelete.*, banner.sessionWarning, demo.*, table.actions, pagination.*
---
Task ID: 2-b
Agent: general-purpose
Task: Rule-based DQ views (Rule Management, Run Quality Check, Check Results, Quality Dashboard, Reports & Export)

Work Log:
- Read worklog + all foundation APIs (types, stores, i18n, mock, utils, shared components) before writing code
- Filled `src/lib/i18n/translations/dq.ts` with `dqTranslations` = `{ en: { dq: {...} }, th: { dq: {...} } }` — all strings for the 5 views under `dq.rules / dq.run / dq.results / dq.dash / dq.reports` in both languages (Thai primary, English tech terms kept)
- `rule-management-view.tsx`: PageHeader + violet Draft-status info Alert (own text + `demo.notRealEngine`); DataTable over rules (bold name+desc, dimension Badge, dataset lookup → `dq.rules.anyDataset` when null, column, checkType (hideBelow md), severity StatusBadge, draft StatusBadge, version vN (hideBelow lg), Switch toggle with aria-label, edit/delete icon buttons with aria-labels); searchKeys name/description; dimension/severity/dataset (incl. any-dataset) filters; create/edit Dialog with controlled form state, per-checkType auto operator map, dynamic value label/placeholder (value_range → "เช่น 0,120", allowed_values → "เช่น active, pending"), dataset-driven column Select (Input fallback), enabled Switch, referenceInfo Textarea + amber Alert only for accuracy; manual inline validation (`text-destructive text-xs`); create → addRule(uid('rule'), status draft, v1) / edit → updateRule(id, patch, true) version bump; delete via AlertDialog (`confirmDelete.*`) + toasts
- `run-quality-check-view.tsx`: dataset Select (resets selection), rules checklist Card (max-h-72 overflow scrollbar-thin) with Checkbox rows showing name, dimension badge, severity StatusBadge, vN, disabled Badge + skip note, amber mini-alert for accuracy rules without referenceInfo; select-all/clear + selected count; summary Card (dataset/rowCount/selected count + severity & dimension count chips + disabled-excluded note); Run button disabled with DisabledHint reasons; run flow = LoadingState (`dq.run.simulating`) → setTimeout 1200ms → simulateCheckRun(dataset, selectedRules) → addCheckRun → toast → navigate('check-results', { runId }); timer ref cleanup on unmount
- `check-results-view.tsx`: list/detail split by `params.runId`; list = DataTable desc by startedAt (mono short runId, dataset, formatDate hideBelow md, totalRows, passRate percent + StatusBadge success/warning/destructive at ≥90/≥70, issueCount, Eye/Trash2 actions + AlertDialog delete); detail = back button clearing runId, meta card (mono Run ID, dataset, time, duration, DemoBadge + simulated Badge, rule-versions count), 4 StatCards (total/evaluated sublabel, passed success, failed destructive, notAssessed warning), teal distinction info strip (`dq.results.distinction` rows/issues + `dq.results.passRateFormula`), per-rule results DataTable (vN, dimension, severity, failed/passed/notAssessed (hideBelow sm), passRate + CircleCheck/CircleX), issues section with own search + dimension/severity Select filters feeding filtered issues (export exports exactly the filtered rows), issues DataTable (row #N, column, cellPreview value, ruleName hideBelow md, translated reason `t(reasonKey, reasonParams)`, severity, dimension hideBelow lg) with in-table EmptyState; CSV/JSON export headers row/column/value/rule/dimension/severity/reason via downloadCsv/downloadJson + timestampName
- `quality-dashboard-view.tsx`: dataset + time-range (7/30/all) filters; KPI StatCards (runs, overall pass rate TrendingUp, issues destructive, datasets covered) grid-cols-2 lg:grid-cols-4; StatusDonutChart pass/fail/notAssessed (emerald/red/amber) with overall pass % center; formula card (Calculator, `dq.dash.formula` + `dq.dash.formulaBase` with passed/evaluated/runs counts + separation note); dimension card (DimensionBarChart percentScale + avg pass% / base-count mini table); trend card (TrendLineChart yDomain [0,1], x = dd/MM HH:mm); top-6 rules CountBarChart by issue counts (violet); EmptyState CTA to run view when no runs in range
- `reports-export-view.tsx`: run Select (latest default) + RadioGroup summary|issues; always-visible metadata strip (dataset, mono Run ID, rule versions list or count, generated time, DemoBadge + simulated Badge); summary preview = dl metrics + formula + per-dimension avg pass% table; issues preview = compact sticky-header table (max-h-96 scrollbar-thin); working Export CSV/JSON (`summary_{runId}` / `issues_{runId}` filenames via timestampName) + toast; PDF button disabled + DisabledHint `dq.reports.pdfDisabled`; EmptyState CTA when no runs
- Verified: `bunx eslint` on all 6 files → 0 problems; `bunx tsc --noEmit` → no errors under src/; GET / → 200 (dev server compiles page importing all new views)

Stage Summary:
- All 5 rule-based DQ views implemented with zero hardcoded UI strings — every label passes through `t()`. New i18n namespaces: `dq.rules.*` (table cols, filters, form labels/placeholders/errors, draft notice, accuracyNeedsReference, toasts, empty), `dq.run.*` (dataset select, checklist, summary, simulate button/hints/toasts, no-rules empty), `dq.results.*` (list cols, meta, stat labels, distinction, passRateFormula, ruleTable, issueTable, filters, empty, toasts), `dq.dash.*` (filters, KPIs, donut, formula, dimension, trend, topRules, empty), `dq.reports.*` (run/type selects, metadata, preview, pdfDisabled, toasts, empty). Reused common keys: nav.*, actions.*, status.*, severity.*, dimension.*, checkType.*, demo.*, issueReason.*, confirmDelete.*, table.*, misc.*. Key decisions: pass-rate color thresholds ≥90/≥70 with icon+text (never color alone); accuracy rules without referenceInfo get amber warnings in both rule form and run checklist; disabled rules auto-excluded by simulator (communicated in UI); issue filters/search implemented outside DataTable so CSV/JSON export always matches the visible filtered rows; dashboard aggregates = weighted pass rate (sum passed ÷ sum evaluated) with "not assessed" excluded, base counts shown in formula card and dimension table.
---
Task ID: 2-c
Agent: general-purpose
Task: ML views (Training Workspace, Training Results, Human Review, Model Registry, ML Quality Check, ML Check Results, ML Dashboard, ML Reports & Export)

Work Log:
- Rewrote `src/lib/i18n/translations/ml.ts` with full `ml.*` namespace for en+th (subtrees: ws, results, review, registry, check, checkResults, dash, reports). All 254 static `t()` keys verified present in BOTH langs via a throwaway key-check script; shared keys reused from common (status.*, demo.*, confirmDelete.*, actions.*, misc.*, table.*, mlReason.*).
- `training-workspace-view.tsx`: Tabs for supervised/unsupervised, 2-col layout (forms left, sticky summary right with red "ยังไม่ได้เลือก" markers), dataset preselect from params.datasetId, target options = columns − features, feature checkbox list (max-h-48 scrollbar-thin + count badge), preprocessing (missing strategy/scaling Switch/encoding), per-mode parameters (test_size + n_estimators / contamination), auto-default names `${algorithm} — ${datasetName}` until touched, validation with specific DisabledHint reasons, Start → creates TrainingRun (running) → navigate to results → completion after 1800ms.
- Simulated-completion timers live at MODULE scope (keyed per run, store-only mutations, guarded by store status re-check): they must survive the navigate() unmount or runs would stay "running" forever. TrainingResultsView additionally self-heals orphaned "running" runs (elapsed > 5s → completes + creates missing model, e.g. after page refresh). Component-scoped timers (ML check 1200ms simulation) ARE cleaned up in useEffect returns.
- `training-results-view.tsx`: list DataTable (mode badges teal/violet outline, StatusBadge completed/running/failed/queued, hideBelow md/lg, Eye action) + detail mode (back, meta card with mono run id + Demo/simulated badges, metric StatCards 2-decimals, LossCurveChart card "(จำลอง)", preprocessing/parameters recap, Register model (staged→registered + toast, disabled + hint when registered/archived/no model), Deploy always disabled + hint, Export metrics JSON).
- `human-review-view.tsx`: explanation Alert (UserCheck), ML check run selector (desc, honors params.mlCheckId from the Review deep-link), 4 mini stat cards (flagged/pending/keep/flag joined from reviews), flagged DataTable (rowIndex #, mono snippet preview, score 3-dec + severity StatusBadge ≥0.9/≥0.8, reason via mlReason.*, review status badge), decision filter joining reviews, Keep/Flag actions → upsertReview + toast, session-only note.
- `model-registry-view.tsx`: DataTable (v{n}, best metric = first metrics entry, registered/staged/draft/archived badges, filters mode+status, search name/algorithm), details Dialog (info + all metrics + DemoBadge), archive via AlertDialog → updateModel + toast (disabled when archived), Deploy always disabled inside Tooltip (span-wrapped trigger for Radix), EmptyState CTA.
- `ml-quality-check-view.tsx`: model select "name (vN)", dataset select, shadcn Slider threshold 0.5–0.99 step 0.01 (default 0.8, current value shown, hint "คะแนน ≥ threshold จะถูก flag"), setup recap card, Run button (Radar) disabled with specific hints until model+dataset chosen, 1200ms LoadingState → simulateMlCheck → addMlCheckRun → toast → navigate to results.
- `ml-check-results-view.tsx`: list (mono short id, flag rate % with ≥15%/≥8% severity badges, view + delete via AlertDialog using common confirmDelete.*) + detail (meta card, 4 StatCards, flagged DataTable with quick Keep/Flag + "Review" deep-link navigate('human-review', { mlCheckId })), CSV/JSON export of flagged rows (headers row/score/reason + union of snippet keys, timestampName), Demo note strip. Store has no deleteMlCheckRun action → used `useDataStore.setState` (also purges related reviews) without editing the store file.
- `ml-dashboard-view.tsx`: KPI cards (models/training runs/check runs/avg flag rate %), StatusDonutChart runs-by-mode (teal+violet from CHART_COLORS), CountBarChart models-by-status (emerald/teal/amber/slate), TrendLineChart flag rate per check run (yDomain [0,1], percent formatter, oldest→newest), formula card "Flag Rate = แถวที่ถูก flag ÷ จำนวนแถวที่ตรวจ × 100", EmptyStates + CTAs when no data.
- `ml-reports-export-view.tsx`: run selector (default latest) + RadioGroup summary|flagged, metadata strip (model, version via modelId lookup, mono run id, dataset, threshold, generated-at + Demo/simulated badges), summary preview (incl. flag-rate formula + per-score-band mini table ≥0.9 / 0.8–0.9 / <0.8), flagged preview (compact table max-h-96 scrollbar-thin), working CSV/JSON exports per report type, PDF disabled + DisabledHint, EmptyState CTA to ML Quality Check.
- Verification: `bunx eslint` on all 9 files → 0 problems; `tsc --noEmit` → no errors in src/ (only pre-existing errors in examples/ & skills/). Dev server not started; no other files modified; no packages installed.

Stage Summary:
- All 8 ML views + ml.ts translations implemented; strictly typed (no `any`), all UI strings via i18n (ml.* + common reuse), teal/emerald/amber/red/violet palette only.
- Key decisions: (1) simulated training completion uses module-scope timers keyed per run because navigate() unmounts the workspace — timer only mutates zustand store and is status-guarded; results view self-heals orphaned running runs; (2) ML check run deletion done via `useDataStore.setState` since the store lacks a delete action (also cascades reviews); (3) score-band helper thresholds: score ≥0.9 destructive / ≥0.8 warning / else info; flag-rate ≥15% destructive / ≥8% warning / else success; (4) Review deep-links pass mlCheckId param and HumanReviewView honors it on mount.
- i18n keys added under `ml.*`: ws.* (config form, validation errors, toasts), results.* (columns, meta, metrics/loss, register/deploy/export), review.* (explain, columns, score labels, decisions, note), registry.* (columns, details, archive, deploy disabled), check.* (controls, threshold, simulate, toasts, need*), checkResults.* (columns, meta, stats, export, note), dash.* (KPIs, chart titles, formula), reports.* (types, metadata, bands, exports, pdf disabled) — all present in en+th.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Integration, lint, browser end-to-end QA, responsive check

Work Log:
- Full `bun run lint` clean; `tsc --noEmit` clean under src/
- Agent-browser E2E verified: Overview → Datasets (table, demo badges, pagination) → Dataset Detail (tabs preview/columns, exports) → Import Data (real CSV upload: file info, validation success, column type detection incl. 1 empty cell, preview, toast, auto-navigate to detail) → Rule Management (dialog form, validation error shown when severity missing, rule created with Draft status + toast) → Run Quality Check (dataset select, select-all rules, severity/dimension summary, simulated run) → Check Results (meta, 4 KPI cards pass/fail/not-assessed, per-rule table, issues table w/ filters, export buttons) → Quality Dashboard (KPIs, donut, formula card with base counts, dimension table, top-6 chart) → Reports & Export (summary/issues radio, metadata strip, working CSV/JSON, PDF disabled=true + hint) → Training Workspace (supervised flow: dataset/target/features/algorithm/params/names, disabled start w/ reason, simulated completion) → Training Results (metrics, loss curve, config recap) → Human Review (Keep action updated stats 5|4|1|0) → Model Registry (3 models incl. new staged) → ML Quality Check (threshold slider, simulated run) → ML Check Results (KPIs, flagged table)
- Fixed bug 1: issue reasons rendered raw i18n keys in check-results-view + reports-export-view (missing `issueReason.` prefix) → fixed both
- Fixed bug 2: simulator missing `column`/`value` reasonParams → added so `{column}`/`{value}` placeholders resolve
- Verified i18n switch TH↔EN end-to-end (sidebar, breadcrumb, tables, buttons, footer)
- Verified mobile 390x844: collapsed table columns, hamburger drawer, stacked header
- Verified dark mode on dashboard
- Transient compile errors seen during subagent file swap are gone; dev.log clean, GET / 200

Stage Summary:
- All 17 views implemented and browser-verified. App skeleton complete per scope: layout/navigation, TH/EN, forms+validation, CSV/JSON import with clear errors (nested JSON rejected), rules CRUD (Draft), table search/filter/sort/pagination, CSV/JSON export, simulated (Demo-labeled) check runs and ML flows, disabled buttons always explained, status never color-only.

---
Task ID: 4
Agent: main (Z.ai Code) — cron webDevReview round 2
Task: QA assessment + new features + styling polish

Work Log:
- Status assessment: read worklog (round 1 complete, 17 views), dev.log clean, GET / 200, agent-browser smoke test of 5 key views all render, `bun run lint` clean → stable, so proceeded to feature work per round mandate.
- FEATURE Command Palette (⌘K / Ctrl+K): new `src/components/dq/command-palette.tsx` (cmdk CommandDialog) — Pages group (all 16 views), search groups for Datasets / Rules / Check runs / Models (live from store), Quick actions (new rule, import, language switch, theme, reset demo). Header trigger button with ⌘K/Ctrl+K kbd hint (mac detect). i18n `palette.*` in common.ts (th+en). Mounted in AppShell.
- FEATURE Import sample files: built-in SAMPLE_CSV_CONTENT (products w/ 2 empty cells) + SAMPLE_JSON_CONTENT (orders, flat array); "โหลด CSV/JSON ตัวอย่าง" buttons under dropzone construct a File() and feed the normal validation flow + toast. i18n `data.import.sample*`.
- FEATURE Rename dataset: header "เปลี่ยนชื่อ" button on Dataset Detail opens Dialog (pre-filled, inline required validation, Enter submits) → wires the previously-unused `updateDatasetName` store action + toast. i18n `data.detail.rename*`.
- FEATURE Duplicate rule: Copy icon in Rule Management actions → creates independent Draft v1 copy named "… (สำเนา)", disabled by default, toast. i18n `dq.rules.duplicateAction/copyOf/duplicated`.
- FEATURE Run comparison: Check Results detail shows strip "เทียบกับรอบก่อนหน้า" with delta chips — pass rate Δ (emerald/red + TrendingUp/Down icon) and issues Δ (emerald/amber), base = previous run id + time of same dataset. i18n `dq.results.compare*`.
- STYLING Progress bar: Run Quality Check simulation now shows animated teal Progress with % + step text (เตรียมแถว → ใช้ Rule ตรวจ → รวบรวมปัญหา) instead of skeleton; interval cleanup on unmount. i18n `dq.run.simProgressSteps`.
- STYLING Page transitions: ViewRouter in page.tsx wrapped in framer-motion AnimatePresence (fade+8px slide, 180ms, mode=wait, key=view).
- STYLING Container: main content max-w-7xl mx-auto; skip-to-content link (focus-visible); sidebar active item gets left indicator bar; scrollbar-thin on sidebar + DataTable scroll area; DataTable default cells get title tooltip; StatCard hover shadow.
- Browser verification: Ctrl+K opens palette (TH+EN), search "customer" finds dataset/rule/runs, Enter navigates to detail; sample CSV loads → validation → import → detail; rename persisted (h1 + toast + reflected in rules table + run meta); duplicate 8→9 rows + toast; progress bar at 22% screenshot → run completes → comparison strip shows -2.4% pass delta vs previous run with correct icons; EN keys verified (compare/sample/duplicate/palette); mobile 390px no horizontal overflow; lint clean; tsc src/ clean (only pre-existing skills/ error).

Stage Summary:
- Round 2 delivered: Command Palette, sample-file import, dataset rename, rule duplicate, run comparison deltas, progress bar, page transitions, container/a11y/table polish. All features remain prototype-safe (session-only, Demo-labeled where relevant).

Unresolved / risks / next-step recommendations:
- Rule engine still simulated (by design); when wired, reuse simulateCheckRun interface so Check Results stays unchanged.
- Palette does not yet deep-link rules to filtered rule-management view or ML runs to results (could add params: mlRunId/mlCheckId items) — easy next win.
- Import sample files could be extended with a deliberately "bad" file to demo all error states.
- Human Review bulk actions + note editing still minimal.

---
Task ID: 5 (cron webDevReview round 3)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + bug fixes + new features + styling polish

Work Log (status assessment first):
- Read worklog: rounds 1–2 complete (17 views + command palette etc.). dev.log clean, GET / 200, `bun run lint` clean, tsc clean under src/ → stable, so per round mandate proceeded to QA + feature work.
- agent-browser QA sweep: Overview, Run Quality Check (dataset select → select all → progress bar → auto-navigate), Check Results (comparison strip +7.2%/-3 vs previous run), Quality Dashboard (KPIs/donut/formula card), ML Dashboard, Import Data, Human Review — all render, zero console/page errors on clean navigation.
- BUG 1 (mobile horizontal overflow): recharts Tooltip wrapper renders off-screen (right:537 at 390px) causing page-level horizontal scroll on ML Dashboard → fixed by adding `overflow-hidden` to all 5 chart container divs in `src/components/dq/charts.tsx` (TrendLineChart, DimensionBarChart, CountBarChart, StatusDonutChart, LossCurveChart). Verified: `document.documentElement.scrollWidth === 390` on ML Dashboard + Quality Dashboard even after hover-spawned tooltips.
- BUG 2 (parse errors invisible): in Import Data, parse failures (result.ok=false, e.g. CSV without header, nested JSON) only turned the file-info strip red — the detailed reason Alert never rendered because it was gated on the separate `error` state (pre-check failures only). Fixed via `activeError = error ?? (result && !result.ok ? {code: result.errorCode} : null)` so both paths show the destructive Alert with the mapped i18n reason.
- BUG 3 (page-size selector blank): new DataTable page-size select initialized from consumer `pageSize` (e.g. Model Registry uses 8) showed an empty SelectValue because 8 ∉ [5,10,20,50] → `pageSizeOptions(initial)` = unique sorted [5,10,20,50,initial]. Verified trigger shows "8" and switching to 5 gives "แสดง 1–5 จาก 8 · หน้า 1 จาก 2".
- FEATURE bad sample files: two deliberately invalid built-in samples + red-tinted buttons under the dropzone — "CSV ผิด (ไม่มีหัวตาราง)" (blank header row → parser renames empty headers to column_N → csv_no_header) and "JSON แบบซ้อน" (array of objects whose customer value is an object → json_nested, never silently flattened). Crafted contents to trip the exact error codes (first attempt didn't — first line looked like a header). Toast explains the sample is invalid on purpose. i18n `data.import.sampleBad*` + `sampleBadLoaded`.
- FEATURE import auto-name: dataset-name Input now follows the file name (sample-products → nested-orders) until the user manually edits it (`nameTouched` flag), instead of staying stale from a previous file.
- FEATURE Rule Management → Run: per-row Play button (tooltip "รันตรวจคุณภาพด้วย Rule นี้") → navigate('run-quality-check', { datasetId?, ruleIds }). Added `ruleIds` to ParamKey + hash parser in use-app-store; Run view consumes params on mount (preset effect with guard + clearParams) and shows a teal "preset loaded — N rules preselected" Alert. Verified end-to-end: rule "Email ห้ามว่าง" → dataset Customer Master preselected + rule checked + banner shown.
- FEATURE command palette deep-links: new groups "รอบการเทรน" (trainingRuns → training-results?mlRunId) and "รอบตรวจด้วย ML" (mlCheckRuns → ml-check-results?mlCheckId); models now pass modelId → Model Registry auto-opens its details dialog (new useEffect consuming params.modelId + clearParams). Verified both.
- FEATURE Human Review: bulk action strip "รอการตรวจสอบ N แถว" with "ยืนยันทั้งหมดที่รอ (Keep)" / "แจ้งปัญหาทั้งหมดที่รอ (Flag)" applying to all pending rows (loop upsertReview + single toast with count; disabled + DisabledHint when none). Per-row note column (StickyNote button, teal when note exists, truncated preview) → Dialog with required Textarea (inline error when empty) → upsertReview(run, rowIndex, existing decision, note); note visible in table. Verified: bulk Keep 4→0 pending; note saved and rendered.
- STYLING: new `TrendAreaChart` (recharts Area + linearGradient teal fill, useId-based gradient id) replaces TrendLineChart in Quality Dashboard trend card; header gets 2px teal→emerald gradient accent bar; sidebar brand mark gradient (from-teal-600 to-emerald-500) + shadow; DataTable search input has leading Search icon; DataTable pagination row adds page-size select (5/10/20/50 + initial) with "แถวต่อหน้า" label; EmptyState icon circle now bg-primary/10 + ring (themed instead of gray); DisabledHint uses Info icon instead of "ℹ" character; `devIndicators: false` in next.config.ts removes the floating Next.js badge that overlapped the footer; sample strip wraps (flex-wrap) for 4 buttons.
- i18n: new keys all in th+en — `palette.groupTrainingRuns/groupMlChecks` (common), `table.pageSize` (common), `dq.rules.runWithRule`, `dq.run.presetLoaded` (dq), `data.import.sampleBadCsv/sampleBadJson/sampleBadLoaded` (data), `ml.review.bulkPending/bulkKeep/bulkFlag/bulkSaved/bulkSavedDesc/bulkNone/colNote/noteAction/noteAdd/noteTitle/noteDesc/notePlaceholder/noteRequired/noteSaved` (ml).
- Verification: `bun run lint` clean; `tsc --noEmit` clean under src/; browser E2E of every new flow (listed above) with zero page errors after `errors --clear` + fresh navigation; mobile 390px scrollWidth exactly 390 on chart-heavy views.

Stage Summary:
- Round 3: 3 real bugs fixed (mobile chart overflow, invisible parse-error reasons, blank page-size select), 4 features added (invalid sample files, rule→run preset flow, palette ML/model deep-links, human-review bulk + notes), 8 styling details polished. All features session-only and prototype-safe; honesty labels unchanged.

Unresolved / risks / next-step recommendations:
- Rule engine + ML still simulated (by design); PDF export still disabled with reason.
- Rule Management palette items still land on the unfiltered list (ruleIds param currently only consumed by Run Quality Check view) — could add a "filter to rule" preset in Rule Management.
- DataTable page-size select is per-instance state; persists only while mounted (acceptable for prototype).
- Next good candidates: check-results issue table bulk-export filters persistence, dataset detail sparkline, or wiring the real rule engine behind simulateCheckRun's interface.


---
Task ID: 6 (cron webDevReview round 4)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + bug fix + new features (print/PDF, rules import/export, checklist, deep-link filter, column profile) + print styling

Work Log (status assessment first):
- Read worklog rounds 1–3; dev.log clean, GET / 200, lint + tsc clean → stable, proceeded to QA + feature work per round mandate
- agent-browser QA sweep: 10 desktop views + 7 mobile (390px) views — zero page errors, zero horizontal overflow (scrollWidth exactly 390 on all), run-quality-check interactive smoke OK; identified the stray "ปิด" snapshot entry as the SessionBanner dismiss button (legit)

BUG FIXED (a11y):
- CommandDialog (src/components/ui/command.tsx) rendered its sr-only DialogHeader/DialogTitle/DialogDescription as a direct child of <Dialog> — outside the Radix portal — so an invisible "Command Palette" heading was permanently mounted in the DOM even when closed, polluting the accessibility tree. Moved DialogHeader inside DialogContent so it only mounts when open. Verified heading gone from closed-state snapshot.

FEATURE Browser Print / Save-as-PDF (real, honest):
- New @media print stylesheet in globals.css: [data-print-hide] display:none; main padding/max-width reset; .print-expand removes max-height/overflow on scrollable previews; tr/td/th break-inside:avoid + thead table-header-group; dark-mode light-palette override for printing
- data-print-hide added to app-shell chrome: header, desktop sidebar, mobile breadcrumb row, session banner, footer
- Both Reports & Export views (dq + ml): controls card and export actions marked data-print-hide; metadata+preview wrapped in .print-area; issues/flagged previews get print-expand; NEW enabled "พิมพ์ / บันทึก PDF" button (Printer icon) calling window.print(); direct "Export PDF" stays disabled with updated honest reason pointing to the print path; new hint explains the browser save-as-PDF flow. Verified via agent-browser pdf output: chrome removed, metadata + summary + dimension table + Demo/จำลอง badges all printed (honesty preserved on paper)

FEATURE Rules JSON export/import (Rule Management):
- Export: header button downloads rules_{timestamp}.json payload {format:'dqs-rules-export', version, exportedAt, count, rules:[... incl datasetName snapshot]}
- Import: dialog with hidden file input (.json) → FileReader parse → strict validation (JSON object with rules array; per-item name/dimension/severity/checkType must match enums; unknown datasetId → null) → result box shows "นำเข้า N rules สำเร็จ ข้าม M รายการ" + preview list → confirm adds each as independent Draft v1 disabled (safe default) + toast. Error states: invalid file / empty array / all-invalid. Browser-verified: export 8 rules → file OK; import mixed file (2 valid + 2 invalid) → summary correct, table 8→10

FEATURE Getting-started checklist (Overview):
- New teal-gradient card after stats: 4 steps (import dataset / create rule / run check / ML check) computed live from store (datasets.length, rules.length, checkRuns.length, mlCheckRuns.length), Progress bar + "เสร็จแล้ว {done}/{total}", per-step clickable rows (check-circle emerald + strikethrough when done, muted circle when pending, icon+Go+arrow CTA), all-done emerald banner. TH/EN verified; mobile 390px clean

FEATURE Rule deep-link filter (Rule Management):
- Consumes params.ruleIds on mount (comma-separated, clears params): filters table to those rules with teal banner "กำลังแสดง N rules จากลิงก์ที่เปิดมา" + "แสดงทุก Rule" clear button; falls back to all rules when no match. Command Palette rule items now navigate with {ruleIds: id} → browser-verified end-to-end (palette search "email" → 1-row filtered table + banner → clear → 10 rows)

FEATURE Dataset Detail column profile:
- Columns tab now opens with a profile summary grid: StatusDonutChart of detected column types (string/number/boolean/date/unknown with themed colors, center = column count) + 4 stat tiles (total cells rows×columns, empty cells, cell completeness % with colored mini bar ≥95 emerald / ≥80 amber / else red, unique values across columns) above the per-column table. TH/EN keys added

i18n: new keys all th+en — dq.rules.{exportRules, importRules, importDialogTitle/Desc, importChooseFile, importImportBtn, importInvalidFile, importNoRules, importSummary, importAllInvalid, importedAsDraft, linkFilterBanner, linkFilterClear}; dq.reports.{printButton, printHint} + pdfDisabled rewritten (both langs); ml.reports.{printButton, printHint} + pdfDisabled rewritten; data.overview.{checklist* ×12, demoPdf updated to mention browser print}; data.detail.{profileTitle, profileStatsTitle, profileCells, profileNulls, profileCompleteness, profileUnique}

Verification: bun run lint → 0 problems; tsc --noEmit → no errors in app code (only pre-existing skills/ example error); agent-browser E2E of every new flow listed above with zero page errors; TH/EN switch re-verified; mobile 390px scrollWidth clean on new views; artifacts saved to download/: qa-columns-profile.png, qa-overview-en.png, qa-ml-reports.png, qa-report-print.pdf

Stage Summary:
- Round 4 delivered: 1 a11y bug fix, 5 features (browser print/save-PDF on both report views, rules JSON round-trip, getting-started checklist, rule deep-link filter, dataset column profile), print stylesheet system. PDF honesty model refined: direct PDF export stays disabled-with-reason; browser print is a real working path and labeled as such.

Unresolved / risks / next-step recommendations:
- Rule engine + ML still simulated (by design); PDF-direct still disabled (print path covers the need in-browser)
- Checklist "done" states are presence-based (any dataset/rule/run) — could become per-user-action tracking with localStorage if desired
- Rules import currently force-disables imported rules (safe default); could add an "import + enable" option later
- Next good candidates: dataset comparison view, issue reason frequency chart on dashboard, or wiring the real rule engine behind simulateCheckRun's interface

---
Task ID: 7 (cron webDevReview round 5)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + new features (dashboard severity/columns analytics, unified activity feed, severity chips, deep-links) + styling polish

Work Log (status assessment first):
- Read worklog rounds 1–4; dev.log clean (GET / 200), `bun run lint` clean, tsc clean under src/ → stable, so per round mandate proceeded to QA + feature work.
- agent-browser QA sweep: all 17 views navigated with zero console/page errors; mobile 390px scrollWidth exactly 390.

FEATURE Dashboard severity + column analytics (Quality Dashboard):
- New "ปัญหาแยกตามความรุนแรง" (Issues by severity) card: 4 clickable severity rows (critical/high/medium/low) each with colored dot + count + proportional progress bar; counts computed from issues across runs in selected range; each row deep-links to the latest run containing that severity (disabled + honest cursor when no run has it); Demo badge kept.
- New "คอลัมน์ที่มีปัญหามากที่สุด" (Most affected columns) card: CountBarChart (teal) of top 6 columns by issue count from real displayed data.
- PageHeader gains "ดูผลการตรวจสอบ" (View check results) outline action → check-results list.
- Deep-link param: `#/quality-dashboard?datasetId=…` presets the dataset filter once on mount then clears params (consumed-guard pattern). Wired from Dataset Detail via new ghost BarChart3 icon button ("ดูคุณภาพในแดชบอร์ด") in PageHeader actions. Browser-verified: hash cleaned to #/quality-dashboard, select shows preset dataset.

FEATURE Overview unified activity feed:
- Replaced "รอบการตรวจล่าสุด" (recent check runs only) with "กิจกรรมล่าสุด" — merged timeline of last 6 events across datasets (นำเข้า/teal), rules (Rule/violet), check runs (ตรวจ/emerald), training runs (เทรน/pink), ML checks (ตรวจ ML/amber).
- Each row: colored circular icon chip (ring-background so it sits on the timeline line), localized description with real values (dataset name + rows, pass rate, flagged count), relative time, type chip badge, hover arrow that slides + turns primary.
- New `formatRelative(iso, lang)` in format.ts: "เมื่อสักครู่ / just now", "N นาทีที่แล้ว / min ago", "N ชั่วโมงที่แล้ว / hr ago", "N วันที่แล้ว / days ago", then localized short date.
- Every item deep-links: dataset→dataset-detail?datasetId, rule→rule-management?ruleIds (existing link-filter), run→check-results?runId, training→training-results?mlRunId, ML→ml-check-results?mlCheckId. Browser-verified 2 of them end-to-end.

FEATURE Check Results severity quick-filter chips:
- Clickable chip group above the issues table: one chip per severity (critical→low order, matching dashboard) with colored dot + live count from the full run (counts stable while other filters change); zero-count chips disabled with title="ไม่พบปัญหา"; active chip = filled variant + aria-pressed, click again to clear back to "all". Chips combine with the existing severity Select (shared state).
- Browser-verified: medium chip → table filtered to 4 รายการ, aria-pressed=true, toggle off → 7 รายการ restored.

STYLING details:
- DataTable: zebra striping (odd rows bg-muted/30, hover bg-muted/50) — verified computed background alternates on datasets table.
- Sidebar: each nav group label now has a leading icon (LayoutDashboard/Database/SlidersHorizontal/BrainCircuit); version footer updated to "v0.5.0 · Prototype" with teal status dot.
- StatCard: icon chip now themed per variant (default=primary/10+ring, success=emerald, warning=amber, destructive=red) + subtle scale-up on card hover.
- i18n: new keys th+en — dq.dash.{severityTitle,severitySub,severityIssues,topColumnsTitle,topColumnsSub,seeResults}, dq.results.severityChipsAria, data.overview.{activityTitle,activityDescription,activityEmpty,activityChip* ×5,activityDesc* ×5}, data.detail.viewInDashboard. SEVERITIES order in check-results aligned to critical-first.

Verification: `bun run lint` → 0 problems; `tsc --noEmit` → no errors in app code (only pre-existing skills/ examples); agent-browser E2E: activity feed renders TH+EN ("3 ชั่วโมงที่แล้ว"/"3 hr ago"), feed clicks navigate with correct params, dataset→dashboard preset + param cleanup, severity cards → correct runs, chips filter/toggle correctly, EN strings verified via palette language action; mobile 390px scrollW=390 on overview/dashboard/check-results; zero page errors after errors --clear + full navigation sweep. Artifacts: download/qa-dashboard-severity.png, qa-mobile-dashboard.png, qa-mobile-chips.png, qa-activity-feed.png, qa-zebra-table.png.

Stage Summary:
- Round 5 delivered: 4 features (dashboard severity breakdown + most-affected-columns analytics, unified cross-ML/DQ activity feed with relative times, severity quick-filter chips, dashboard datasetId deep-link wired from dataset detail) + 4 styling systems (zebra tables, sidebar group icons, themed StatCard chips, version dot). All computed from real displayed data; honesty labels (Demo/จำลอง) preserved on every new card.

Unresolved / risks / next-step recommendations:
- Rule engine + ML still simulated (by design); PDF-direct still disabled (browser print covers it).
- Dashboard severity cards link only to the latest run per severity; a filtered multi-run issue view would need a new "issues across runs" mode.
- Activity feed caps at 6 items with no pagination (acceptable for prototype); rule-edit events are not tracked (rules only have createdAt, no updatedAt events feed — updateRule bumps updatedAt but feed shows creation only, by design).
- Next good candidates: dataset comparison view, dashboard filter persistence in hash, per-severity issue export, or wiring the real rule engine behind simulateCheckRun's interface.

---
Task ID: 8 (cron webDevReview round 6)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + REAL in-browser rule engine + honesty/badge system + styling

Work Log (status assessment first):
- Read worklog rounds 1–5; dev.log clean (GET / 200), `bun run lint` clean, tsc clean under src/ → stable. Chose the top next-step candidate from round 5: wiring the REAL rule engine behind simulateCheckRun's interface.

FEATURE Real rule engine (the app's checks are now genuinely computed):
- New `src/lib/engine/rule-engine.ts` (~490 lines): evaluates enabled rules against ACTUAL dataset rows in the browser — no randomness, no server. Implements all 9 check types for real: not_null, not_duplicate (all-but-first occurrence fails, with first-occurrence row param), data_type (number/date/boolean/string), value_range (min,max / single-bound via operator), regex_pattern (invalid regex → rule skipped), allowed_values (case-insensitive list), column_comparison (equals_product_of / equals_sum_of / equals-constant, float-epsilon compare), reference_match (Accuracy: referenceInfo resolves to "<dataset name or id>[|<column>]" against datasets in the store), date_freshness (age in days vs threshold).
- Honesty semantics: empty cells are "not assessed" (neither pass nor fail) for format rules — real DQ-engine behavior; run-level notAssessed = union across rules; skipped rules (missing column / unresolvable reference / bad regex / unparseable params) are excluded from run aggregation and reported per-rule with skipped+skipReason+skipDetail on RuleResult.
- `CheckRun.isSimulated` is now `boolean`: seeded historical runs stay `true` (Demo); every new run is `false` (real). `durationMs` now measures REAL engine time via performance.now (excludes UI pacing).
- API: `preflightRule(dataset, rule, datasets)`, `createEngineSession()` (applyRule per rule → finalize) and `executeCheckRun()` one-shot wrapper.

UI integration:
- Run Quality Check: emerald "Real evaluation — in your browser" alert replaces the amber demo notice; header badge = RealBadge; button "Run real check / เริ่มตรวจจริง"; per-rule PRE-FLIGHT warnings inline on rule cards ("ข้าม: ไม่พบคอลัมน์/ไม่พบชุดข้อมูลอ้างอิง..." with detail) + a skip-list block in the pre-run summary; progress bar now tracks REAL per-rule evaluation ("กำลังประเมิน rule 2/4: <name>") instead of fake timers.
- Check Results: meta card branches — real runs get RealBadge+ตรวจจริง + "ประมวลผลจริง…" chip; simulated runs keep DemoBadge; list view shows a per-run badge column (ตรวจจริง/จำลองผล); skipped rules render an amber banner + SkippedBadge in the per-rule table with reason tooltip and "—" pass rate; real-run distinction alert appends the not-assessed explanation.
- Reports & Export (DQ): metadata badge branches by run type; summary export gains `status` column (ok|skipped) and blank pass_rate for skipped rules; dimension averages exclude skipped rules.
- Quality Dashboard: header/trend/severity badges now dynamic (Demo when any simulated run in range, RealBadge when all real); amber mix-note "ช่วงนี้มี X รอบตรวจจริง และ Y รอบจำลอง (Demo)" when the range mixes both; severity card gains working "Export CSV" button (severity/issues/share from displayed data).
- Rule Management: outdated "not executed yet / next round" draft notice rewritten (Draft label stays, but real runs are available now); removed stale demo.notRealEngine line; Overview checklist step 3 text updated to "real in-browser engine".

i18n: all new keys TH+EN — common.issueReason += duplicate_row/type_value/comparison_expected/freshness_age (old reason keys untouched so seeded runs keep rendering); dq.engine.{realBadge,realBadgeShort,realMetaChip,noticeTitle,notice,notAssessedNote,runButton,running,progressRules,skippedBanner,skip.{badge,no_column,no_reference,bad_regex,bad_value}}; dq.dash.{severityExport,mixNote}; dq.run/results pageDescriptions + dq.rules.draftNotice rewritten; data.overview.checklistStep3Desc updated.

Verification (agent-browser E2E, fresh session, zero page errors):
- Real run on Customer Master (60 rows, 4 rules) produced EXACTLY the predicted real numbers: not_null email = 6 fails; not_duplicate customer_id = 3 fails ("พบครั้งแรกที่แถว #6" — C-0007 first at 1-based row 7); age 0–120 = 5 fails; email regex = 4 fails + 6 not-assessed; run totals 60/54 evaluated/36 passed/18 failed/18 issues/6 not-assessed; passRate 66.7%; duration "1 ms" (real); severity chips วิกฤต 3 / สูง 11 / ปานกลาง 4.
- Real run on Sales Orders = clean 100% pass, 0 issues (total=qty×unit_price holds; status values valid) — proves passing rules work, not just failures.
- Skip flow end-to-end: created Accuracy/reference_match rule with unresolvable referenceInfo → preflight warning on the rule card AND in pre-run summary → after run, skipped banner + SkippedBadge + "—" rate in results.
- Check Results list: new run "ตรวจจริง", seeded history "จำลองผล"; dashboard mix note "1 รอบตรวจจริง และ 14 รอบจำลอง"; severity CSV exported (dq_severity_breakdown_*.csv downloaded).
- TH↔EN verified for every new key; mobile 390px scrollWidth exactly 390 on run/results/dashboard; `bun run lint` 0 problems; tsc clean under src/; dev.log clean.
- Artifacts: download/qa-real-engine-results.png, qa-real-run-mobile.png, qa-real-run-desktop.png.

Stage Summary:
- Round 6 turned the flagship feature honest-and-real: rule checks are now truly evaluated row-by-row in the browser with real issue reasons, real not-assessed semantics, real pre-flight skipping, and per-run real/simulated labeling everywhere (list, detail, reports, dashboard). Demo labeling remains exactly where things are still simulated (seeded history, all ML flows, PDF-direct).

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design).
- Old seeded sessions (pre-round-6) hold isSimulated:true runs — fully compatible; users can reset demo data to reseed.
- reference_match UX could add a reference-dataset Select in the rule form instead of free-text referenceInfo.
- Next good candidates: persist dashboard filter selection in hash, issue reason frequency chart, dataset comparison view, or chunked Web-Worker execution for very large imported files.

---
Task ID: 9 (cron webDevReview round 7)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + new features (issue-reason analytics, dashboard filter persistence, reference dataset picker, reason filter on check results) + styling/robustness polish

Work Log (status assessment first):
- Read worklog rounds 1–6; dev.log clean (GET / 200), `bun run lint` 0 problems, tsc clean under src/ → stable; proceeded to QA + feature work per round mandate
- agent-browser QA sweep found 2 REAL mobile-overflow bugs (both fixed this round):
  1. quality-dashboard scrollWidth 400 @390px — root cause: `grid gap-6 lg:grid-cols-2` with NO base grid-cols-1 → bare `grid` creates an auto track sized to content min-content (383.89px) → blowout. Fixed by adding base `grid-cols-1`; then swept ALL views and fixed 10 latent instances of the same pattern (`grid gap-N lg:grid-cols-*` → `grid gap-N grid-cols-1 lg:grid-cols-*`), plus ~25 bare single-column `grid gap-*` stacks → `grid grid-cols-1 gap-*` (layout-identical, kills the whole min-content-blowout class)
  2. reports-export scrollWidth 427 @390px — SelectTrigger (`w-fit` + long "runId — datasetName" value) overflowed its 308px track even after grid fix → added `w-full min-w-0` to the run selects in BOTH dq and ML report views (value now line-clamps)

FEATURE Issue-reason frequency card (Quality Dashboard):
- New full-width card "สาเหตุของปัญหาที่พบบ่อย / Top issue reasons" after severity+columns grid: rows = issue reasonKeys aggregated from ALL issues in the selected range (top 8, sorted desc), each with rotating palette dot (teal/violet/amber/pink/slate/emerald), SHORT param-free label, localized "{count} issues" chip, proportional animated bar; rows deep-link to check-results with {runId: latest-run-containing-that-reason, reason: key} (disabled + honest cursor when unreachable); "Export CSV" (reason/issues/share) mirrors the severity card; Demo/Real header badge consistent with range
- New i18n subtree `common.issueReasonShort` (14 keys × TH/EN) — short labels for charts/filters since full issueReason strings contain {params}; keys: issue_reason_null/duplicate/duplicate_row/type/type_value/range/pattern/allowed/comparison/comparison_expected/reference/freshness/freshness_age/generic
- LESSON (recorded): a perl replacement of `t(\`issueReasonShort.${key}\`)` silently ATE the `${key}` interpolations (perl interpolated `$\`) — caught by E2E (labels rendered "issueReasonShort."), repaired via Edit tool; always re-verify template literals after scripted regex edits

FEATURE Dashboard filter persistence (hash + store):
- AppStore gains `dashDataset`/`dashRange` fields + `setDashFilters()` + `removeParam(key)`; parseHash whitelist += reason/dashDataset/dashRange; ParamKey += those 3
- Dashboard: lazy state init (hash param → validated store field → default), persist effect writes store+hash on change (defaults '__all__'/'30' omitted from URL so clean), store value validated against existing datasets (survives "reset demo data"), external `?datasetId=` deep-link still consumed-and-stripped but now REACTIVE to params.datasetId (same-view hash navigation no longer misses it — regression found & fixed in E2E: AnimatePresence key={view} doesn't remount when only params change)
- Browser-verified: change dataset+range → URL `?dashDataset=…&dashRange=all`; navigate away/back → kept; hard reload → kept; deep-link `?datasetId=ds_demo_orders` → preset + URL rewritten to persisted form

FEATURE Reason filter on Check Results (deep-link target):
- Detail view gains "สาเหตุ / Reason" Select (options = distinct reasonKeys of THAT run, frequency-sorted, short labels, disabled when run has no issues); combines with search/dimension/severity/chips; exports already include reason; consumes `?reason=` param (validated against run's reason list, param stripped); effect made reactive to params.reason
- Browser-verified: dashboard reason row click → lands on run with filter preset (e.g. ค่านอกช่วง → 3 รายการ; ค่าว่าง → 4 รายการ); manual filter toggle works

FEATURE Reference dataset picker in Rule form (Accuracy):
- Replaced the raw referenceInfo Textarea with two Selects: Reference dataset (all datasets) + Reference column (columns of chosen dataset, disabled until dataset picked, "ทั้งแถว/Whole row" = no column); composes engine-compatible `referenceInfo = "<dataset name>|<column>"` with a live mono preview line (Radix Select needs non-empty values → __none__/__whole__ sentinels mapped to '')
- Edit path REHYDRATES the picker: parseRefInfo resolves old referenceInfo (by name OR id) → preselects both selects; unresolvable custom text (e.g. imported rules) → falls back to the original Textarea with an honest "custom reference" note + "Use dataset picker" escape hatch (clears to none)
- Browser-verified end-to-end: create Accuracy/reference_match rule via picker (Customer Master|customer_id) → saved → edit dialog shows picker preselected → deleted afterwards

STYLING details:
- DataTable: sticky header now has a border shadow separation line (`shadow-[0_1px_0_0_hsl(var(--border))]`), sorted column header highlighted text-primary + font-medium
- StatCard: subtle hover lift (`hover:-translate-y-0.5`) on top of existing shadow/scale system
- Reason rows share the severity-card hover/focus system (border-primary/50 + bg-muted/50 + ring)

Verification (agent-browser E2E, desktop 1280 + mobile 390, zero page errors after errors --clear):
- Mobile 390 scrollWidth EXACTLY 390 on all 17 views (incl. the two fixed ones); reason card/labels/deep-links/filter verified in TH and EN ("Top issue reasons / Not in allowed list — 18 issues"); reason CSV export clicked OK (dq_reason_breakdown_*.csv); dashboard filter persistence matrix (change/nav-away-back/reload/deep-link) all pass; rule picker create→edit→delete pass; screenshots: download/qa-reason-card.png, qa-reason-filter.png
- `bun run lint` → 0 problems; `tsc --noEmit` → clean under src/; dev.log clean throughout

Stage Summary:
- Round 7 delivered: 2 real mobile-overflow bug fixes (systemic grid hardening across all views), 4 features (issue-reason frequency analytics with deep-links + CSV, dashboard filter persistence in hash+store, reason filter on check results, reference dataset picker replacing free-text referenceInfo), styling polish (sticky header separation, sorted-header highlight, stat-card lift). All analytics computed from real displayed data; honesty badges unchanged.

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design); browser print covers PDF need
- Reason rows link only to the LATEST run containing that reason (consistent with severity cards); a cross-run issue explorer would be a new mode
- Rules import still force-disables imported rules (safe default); "import + enable" option remains a candidate
- Next good candidates: dataset comparison view (schema diff), ML-check flagged-rows export, per-column drill-down from "most affected columns" card, or Web-Worker chunked engine execution for very large imports

---
Task ID: 10 (cron webDevReview round 8)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + new Dataset Compare view + column drill-down + rules import enable option + real bug fix (param-wipe race)

Work Log (status assessment first):
- Read worklog rounds 1–7; dev.log clean (GET / 200), `bun run lint` 0 problems, tsc clean under src/ → stable, so per round mandate proceeded to QA + feature work.
- agent-browser QA sweep: all 17 views desktop + 7 mobile (390px) — zero console errors, scrollWidth exactly 390 everywhere → stable baseline confirmed.

REAL BUG FOUND & FIXED (param-wipe race on view transitions):
- Symptom: after clicking Compare from Dataset Detail, later navigating (or pressing browser Back) to `#/dataset-detail?datasetId=…` showed "ไม่พบชุดข้อมูล" (not found).
- Root cause: AnimatePresence mode="wait" keeps the EXITING view mounted ~180ms while the global params object already belongs to the incoming view. The compare view's reactive deep-link effect (deps include params.datasetId) ran during exit and called removeParam('datasetId'), wiping the param the incoming dataset-detail needed. Same latent race existed in quality-dashboard (params.datasetId) and check-results (params.reason/column).
- Fix: all reactive param-consumption effects now guard with `useAppStore.getState().view !== '<this-view>' → return` before consuming. Verified end-to-end: hash-only navigation compare → detail renders the dataset; browser Back → compare keeps preset; browser Forward → detail renders; dashboard reason deep-link (round 7) still works.

FEATURE Dataset Compare (new view `dataset-compare` — 18th view, real in-browser computation):
- New nav item under Data group (GitCompareArrows icon), breadcrumb, command-palette entry, ViewId + parseHash whitelist + ParamKey 'column'.
- Two selects (A base / B compare) + swap button; same-dataset amber warning; <2 datasets → EmptyState with import CTA.
- 5 StatCards: shared columns / only-in-A / only-in-B / type mismatches (destructive when >0) / row delta (B − A, signed).
- Schema diff table: union of columns (A order first), per-side detected type + nulls + uniques, status badges (ตรงกัน success / ประเภทเปลี่ยนไป warning with amber row highlight / มีเฉพาะใน A info / มีเฉพาะใน B neutral), responsive hidden columns (md/lg), sticky header, Export CSV (column,status,type_a/b,null_a/b,unique_a/b).
- Key/value overlap (REAL set arithmetic on session data): shared-column picker (prefers type-matching), values in both / only-A / only-B / empty cells A/B, coverage % bars per side (|A∩B|/|A distinct|), sample value chips (up to 12 each + "+N" overflow badge).
- Teal "real computation" Alert with new neutral RealBadge label "เปรียบเทียบจริง / Real comparison" (RealBadge now accepts custom label prop).
- Deep-links: consumes `?datasetId=` (presets A + auto-picks B, guarded, param stripped); Dataset Detail gains ghost GitCompareArrows button ("เปรียบเทียบโครงสร้างกับชุดข้อมูลอื่น").
- Math verified in browser: Customer Master (57 distinct ids) vs Sales Orders (32) → shared 30, onlyA 27, onlyB 2, coverage 52.6%/93.8% ✓; imported numeric-customer_id CSV → 1 type mismatch (amber row, string→number) + 0 shared values ✓.

FEATURE Column drill-down (dashboard → check results):
- Dashboard "คอลัมน์ที่มีปัญหามากที่สุด" card converted from static chart to clickable rows (severity/reason-card style: teal gradient bar, mono column name, count, hover ring) deep-linking to `check-results?runId&column=…` (latest run containing that column's issues); Export CSV (column/issues/share) + Demo/Real badge in CardAction.
- Check Results detail: new "คอลัมน์ / Column" Select filter (distinct columns of THAT run, frequency-sorted, mono labels, disabled when no issues), combines with search/dimension/reason/severity/chips; consumes `?column=` param (validated against run's columns, guarded, stripped).
- Verified: dashboard email row → run filtered to 11 email issues; clearing filter restores 16; column select lists email/age/customer_id.

FEATURE Rules import "enable after import" (Rule Management):
- New Checkbox in the import dialog (visible when parse succeeds): "เปิดใช้งานทันทีหลังนำเข้า" with honest hint (off=recommended Draft v1 disabled; on=enabled immediately and counted in pre-run summaries). confirmImport applies `enabled: importEnable` to every imported rule; toast description branches (importedEnabled vs importedAsDraft); state resets on dialog close.
- E2E verified: exported rules JSON → crafted 2-rule import file → uploaded → checked → both rules appear in table with switchState=checked; test rules deleted afterwards.

i18n: all new keys TH+EN — common.nav['dataset-compare']; data.compare.* (~40 keys: pageDescription, realNotice*/realBadgeLabel, select*, swap, sameWarning, needTwo*, importCta, stat* ×5, schema*, col* ×8, status* ×4, overlap* ×8, coverage* ×3, sampleTitle, exportBtn, exported); data.detail.{compare, compareHint}; dq.results.filterColumn; dq.rules.{importedEnabled, importEnable, importEnableHint}; data.compare.statRows shortened after browser check showed truncation ("ผลต่างแถว (B − A)" / "Row delta (B − A)").

Verification (agent-browser E2E, desktop 1280 + mobile 390, zero page errors after errors --clear):
- 18-view desktop sweep clean; mobile scrollWidth exactly 390 on dataset-compare/quality-dashboard/check-results/reports-export; TH↔EN switch verified on the new view (h1/labels/alert/cards all localized); command palette lists "เปรียบเทียบชุดข้อมูล"; swap, export click, deep-link in/out, back/forward all pass; `bun run lint` 0 problems; tsc clean under src/; dev.log clean.
- Artifacts: download/qa-compare-view.png, qa-dashboard-columns.png; test fixtures download/import-rules-test.json, download/compare-mismatch-test.csv (kept for future QA).

Stage Summary:
- Round 8 delivered the 18th view (Dataset Compare — schema drift + type mismatches + real key-overlap analytics with export), full column drill-down (dashboard card rows → per-run column filter), rules import enable-on-import option, and one REAL navigation bug fix (param-wipe race) hardened across all 3 reactive param consumers. All computations real in-browser; honesty labels unchanged (compare is labeled "เปรียบเทียบจริง", ML/PDF remain Demo-labeled).

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design); browser print covers PDF.
- Compare view computes over session data only — very large imported datasets (>10k rows) could make the overlap memo slow; chunked/Web-Worker execution remains a candidate.
- The param-consumption guard pattern is now required for any future reactive param consumer — noted here for future agents.
- Next good candidates: cross-run issue explorer (issues across multiple runs in one table), dataset compare data-level diff for shared columns beyond key overlap, rules "import + enable" per-rule selection, or persisting compare A/B selection in the hash like dashboard filters.

---
Task ID: 11 (cron webDevReview round 9)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + NEW Issue Explorer view (19th) + Issue Row Inspector + compare A/B persistence + DataTable density toggle

Work Log (status assessment first):
- Read worklog rounds 1–8; `bun run lint` 0 problems, tsc clean under src/, dev.log clean → stable baseline. agent-browser QA sweep: all 18 views desktop 1280 scrollW=1280 + mobile 390 spot-checks scrollW=390, zero console errors → proceeded to feature work per round mandate.

FEATURE 1 — Issue Explorer (19th view, `#/issue-explorer`, real session data):
- Unified cross-run issues table: flattens `run.issues` from EVERY DQ check run in the session (real-engine runs + simulated Demo history, each row badge-labeled ตรวจจริง/จำลองผล).
- Filters: search (value/rule/column/dataset/runId) + Dataset + Run (cascade: dataset change resets run filter if out of scope) + Dimension + Reason (short labels, frequency-sorted) + Column + severity quick-chips with counts (disabled with title when 0, aria-pressed, not color-alone).
- 4 StatCards computed from the FILTERED set (issues count w/ destructive/success variant, runs affected, datasets affected, most-common reason with issueReasonShort label + count sublabel).
- Header badge branches: all-real → RealBadge "Real engine data"; mixed → DemoBadge "Mixed · real + Demo"; all-simulated → DemoBadge.
- Export CSV/JSON of the filtered set (run_id/dataset/source/row/column/value/rule/dimension/severity/reason; `source` column marks real vs simulated).
- Click row (or any row) → Issue Row Inspector; EmptyStates: no runs yet (CTA → run-quality-check) and runs-but-no-issues (honest message).
- Persistence identical to dashboard filters: new store fields `exDataset`/`exRun` + `setExplorerFilters()`; hash params `exDataset`/`exRun` (parseHash whitelist extended); mount reconcile = hash→store when params present, store→hash (via setParam) when returning without params; external `?datasetId=` deep-link consumed (guarded).
- Wired: nav item (ScanSearch icon, Rule group, between check-results and dashboard), breadcrumb case, command-palette NAV_ITEMS entry, ViewId + page.tsx route.

FEATURE 2 — Issue Row Inspector (shared `src/components/dq/issue-row-dialog.tsx`):
- Dialog shows the FULL source row a data-quality issue belongs to, read from the dataset currently in the session: every column as dt/dd (mono values), problem column highlighted (bg-primary/5 + ring + "คอลัมน์ที่มีปัญหา" badge), issue meta block (rule, severity + dimension badges, full localized reason).
- Honesty: inspect button disabled with title reason when the dataset was deleted; in-dialog fallback message when rowIndex is out of bounds; footer note "values come from the dataset stored in this session".
- Wired into BOTH check-results detail (new action column + row-click; header "Inspect source row") and the explorer (InspectorHost bridges flat row → CheckRun).

FEATURE 3 — Dataset Compare A/B persistence:
- Store fields `cmpA`/`cmpB` + `setCompareSelection()`; hash params `cmpA`/`cmpB`.
- Consolidated preference effect (hash param → store field → auto-default) replacing the old defaults effect — fixes TWO real bugs found in E2E: (1) leftover old defaults effect raced and overwrote the restore in the same commit (duplicate effect removed); (2) defaults auto-fill "shielded" the late-arriving hash preference — every user pick syncs the store, so divergence = auto-fill → persisted preference wins.
- Mount store→hash re-sync (setParam) so away/back keeps reload-safety; deep-link ?datasetId= still works (guarded); verified matrix: pick → hash `?cmpA=…&cmpB=…`, away+back → restored, reload → restored, reset-demo-data → graceful fallback.

FEATURE 4 — DataTable row-density toggle:
- Comfortable/Compact toggle in every table footer (Rows2/Rows3 icon, aria-pressed, localized label); compact = h-8 headers + py-1.5 cells + text-[13px] via twMerge-safe class overrides; persisted in localStorage `dqs_table_density`, read on every table mount → choice follows the user across all tables and reloads.

REAL BUG FIX (self-inflicted during this round, caught by E2E):
- `setParam` used in explorer/compare mount effects without being declared → client-side exception (page 500-style overlay). Fixed by adding the hook in both views; verified via fresh browser session (0 errors). Also removed a temporary `window.__dqsAppStore` debug line that had caused one SSR 500 (module-scope `window` access) — root cause noted: never touch `window` at module scope in stores.

i18n: all new keys TH+EN — common.nav['issue-explorer']; common.table.{density,densityCompact,densityComfortable}; dq.results.inspector.{open,unavailable,title,rowOf,problemColumn,issueSection,notFound,hint}; dq.explorer.* (~35 keys: pageDescription, realNotice*, badgeAllReal, badgeMix, stat* ×4, filter* ×6, col* ×9, severityChipsAria, empty* ×4, exportBtn, exported, viewRun).

Verification (agent-browser E2E, fresh session, desktop 1280 + mobile 390, zero page errors):
- Explorer: stats (133 issues / 14 runs / top reason ค่านอกช่วง 41), chip toggle 17 critical ("แสดง 1–10 จาก 17"), dataset filter 133→91 + run options cascade, run filter →16; hash `?exDataset=…&exRun=…`; away/back keeps filters via store; reload restores from hash; deep-link `?datasetId=ds_demo_orders` → preset + rewritten to persisted form; CSV export clicked; TH↔EN verified (h1/alerts/stats/filters).
- Inspector: explorer row click → dialog "แถว #12 · Customer Master (Demo)" with 9 columns, email highlighted + value invalid-email-13; check-results detail → row #1 age=63 highlighted; EN keys verified; disabled-state honesty wired.
- Compare persistence matrix (after 2 bug fixes): pick A+B → `?cmpA=…&cmpB=…`; away/back → restored + hash re-synced; reload → restored from hash; reset-demo-data → graceful default. `?datasetId=` deep-link still presets A.
- Density: toggle → compact classes applied + localStorage 'compact'; persists across views (datasets view also compact) and reload; EN/TH labels verified.
- Sweeps: 19 views desktop scrollW=1280, mobile 390 exactly 390 on issue-explorer/compare/check-results/dashboard; command palette lists "Issue Explorer"/"สำรวจปัญหาข้อมูล"; `bun run lint` 0 problems; tsc clean under src/; dev.log clean.
- Artifacts: download/qa-explorer-th.png, qa-inspector-dialog.png, qa-compare-en.png.

Stage Summary:
- Round 9 delivered the 19th view (cross-run Issue Explorer — the top "next candidate" from rounds 5/7/8), the Issue Row Inspector connecting issues to actual stored rows (in both run detail and explorer), compare A/B persistence to full dashboard-parity, and a global row-density preference. All computations real from session data; honesty labels preserved (explorer badges real/mixed/demo per scope; inspector notes session-scope data).

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design).
- Explorer aggregates DQ runs only (not ML flagged rows) — an ML-issues tab could come later.
- The mount store→hash re-sync writes stale persisted ids after "reset demo data" until the next filter change (UI stays correct; ids re-seed identically anyway).
- Param-consumption guard pattern + "consolidated preference effect" are now required patterns for any future persisted-filter view — noted for future agents.
- Next good candidates: dashboard/explorer cross-linking polish (explorer entry points from overview cards), per-issue "copy JSON" in inspector, ML flagged-rows inspector parity, or chunked Web-Worker engine execution for very large imports.

---
Task ID: 12 (cron webDevReview round 10)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA + bug fix (TabsList mobile overflow) + 3 features (Inspector Copy JSON, ML flagged-row inspector, Overview attention card + clickable stats) + styling/dark-mode verification

Work Log (status assessment first):
- Read worklog rounds 1–11; lint 0 problems, tsc clean under src/ (only pre-existing unrelated skills/ error), dev.log clean → stable baseline
- agent-browser QA sweep (19 views desktop 1280 + mobile 390): found ONE real mobile-overflow bug — training-workspace scrollWidth 399 @390px; all other views exactly 390/1280; zero console errors → fixed bug then proceeded to feature work per round mandate

REAL BUG FIXED — TabsList mobile overflow (2 views):
- Root cause: shadcn TabsList is `inline-flex w-fit` + triggers `whitespace-nowrap`; long Thai labels ("แบบมีผู้สอน (Supervised)") pushed the 358px list past the 342px content box
- training-workspace mode Tabs: `grid h-auto w-full grid-cols-1 gap-0.5 sm:h-9 sm:grid-cols-2` + triggers `whitespace-normal py-1.5 sm:whitespace-nowrap` (stacked segmented control on mobile, 2-col on sm+)
- dataset-detail preview/columns Tabs: `grid w-full grid-cols-2` (short labels, equal split)
- Browser-verified: both views exactly 390 @390px after fix

FEATURE Inspector "Copy JSON" (IssueRowInspector, both DQ check-results + explorer):
- New ghost button in the source-row section header: copies a structured JSON payload {issue(id/rule/dimension/severity/rowIndex/column/value/reasonKey/reasonParams), run(id/datasetId/datasetName), full source row keyed by column (null when row unavailable), note:'session-only data'}
- Toast feedback success + destructive fallback when clipboard blocked (honest error); payload built in useMemo from live session data
- E2E: stubbed clipboard.writeText, captured full payload (verified issue meta + row), success toast "คัดลอกปัญหาและแถวข้อมูลต้นทางเป็น JSON แล้ว" rendered; headless clipboard.readText is permission-blocked (expected, fallback path intact)

FEATURE ML flagged-row source inspector (parity with DQ — new component ml-flagged-row-dialog.tsx):
- Detail mode flagged table gains "ดูแถวข้อมูลต้นทาง" ghost button per row → dialog shows: Flag details card (score + score badge, review decision badge keep/flag/pending, localized reason, model-flagged fields as mono chips), then FULL source row from the session dataset with snippet fields highlighted (amber bg + ring + Radar "ถูก flag" badge — visual parity with DQ problem-column highlight but amber ML palette)
- Copy JSON button (same pattern; payload includes isSimulated:true + note "ML flag is simulated (Demo); row values are session-only data"); honest fallbacks: dataset deleted / rowIndex out of bounds → amber notFound message; DemoBadge "จำลองผล" in dialog title
- Wired: inspect button added to detailColumns actions (before keep/flag), dialog rendered in detail mode with decision from reviewMap
- i18n NOTE: an intermediate edit accidentally closed ml.checkResults early (orphaned notFoundTitle etc.) — caught immediately by re-reading the block and repaired to sibling nesting: ml.checkResults{...} then ml.inspector{details/flaggedFields/flaggedField/hint}; tsc confirms no stray keys
- E2E: opened inspector from run mlrun_mv6jk03f7595 row #38 — score 0.849, flagged fields chips, demo badge, copy payload verified

FEATURE Overview "ต้องเฝ้าระวัง / Needs attention" card:
- Aggregates latest 5 critical/high issues across ALL check runs (sorted run.startedAt desc then severity rank); each row: severity StatusBadge (icon+text), rule name + mono column · #row, dataset + relative time, hover arrow; click → check-results?runId (verified deep-link lands on run detail)
- Scope badge honest by composition: all-real runs → RealBadge, all-simulated → DemoBadge(simulated), mixed → DemoBadge "Mixed · real + Demo" (reuses dq.explorer.badgeMix); empty state = emerald CheckCircle2 "ไม่มีปัญหาระดับวิกฤต..." positive message; footer "เปิดสำรวจปัญหาข้อมูล" → issue-explorer
- Card styling: subtle red/amber gradient wash (from-red-500/[0.04] to-amber-500/[0.04]) + border-red-600/20; verified in light AND dark mode (screenshot)

FEATURE Clickable StatCards (badges.tsx StatCard + overview wiring):
- StatCard gains optional onClick/ariaLabel → whole card becomes role=button, tabIndex=0, Enter/Space keyboard handler, focus-visible ring, hover border-primary/40 + ArrowUpRight corner hint fade-in (Card base now `relative` for the absolute icon)
- Overview 4 stats now navigate: datasets→datasets, rules→rule-management, runs→check-results, models→model-registry; ariaLabel "เปิดหน้า {view}" / "Open {view}" localized; non-clickable usages elsewhere unaffected

Verification (agent-browser E2E, desktop 1280 + mobile 390, zero page errors):
- Mobile 390: exactly 390 on overview/ml-check-results/training-workspace/dataset-detail/check-results/issue-explorer/quality-dashboard/reports-export (the 2 fixed views included); desktop 1280: all 19 views exactly 1280
- TH↔EN verified on all new UI (attention card, copy buttons, ML inspector, stat arias); dark mode verified on attention card (badges/gradients/text readable)
- `bun run lint` 0 problems; tsc clean under src/; dev.log clean throughout
- Artifacts: download/qa-r12-overview-attention.png (mobile), qa-r12-attention-desktop.png, qa-r12-attention-dark.png

Stage Summary:
- Round 12 delivered: 1 real mobile-overflow bug fix (TabsList class, 2 views), Inspector Copy JSON, full ML flagged-row inspector parity (amber highlight system + honest Demo labeling), Overview Needs-attention card with honest scope badges + deep-links, and clickable keyboard-accessible StatCards. All computations real from session data; ML flows remain Demo-labeled by design.

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design); browser print covers PDF
- Clipboard API blocked in some browsers/environments → destructive toast fallback exists; no execCommand fallback added (deprecated, judged unnecessary)
- StatCard clickable pattern: keep ariaLabel meaningful; nested interactive elements must never be added inside a clickable StatCard
- Next good candidates: cross-run issue trend sparkline on overview, per-rule drill-down page from attention card, Web-Worker chunked engine execution for very large imports, or persisting explorer filter state for severity/column params (currently only dataset/run persisted)

---
Task ID: 13 (cron webDevReview round 13)
Agent: main (Z.ai Code)
Task: Status assessment + agent-browser QA (baseline was clean/stable → feature round) + 4 new features (Overview Quality-Trend chart, Rule Statistics sheet, Human-review undo, Explorer exSev persistence) + full E2E verification

Work Log (status assessment first):
- Read worklog rounds 1–12; lint 0 problems, tsc clean under src/ (only pre-existing examples/skills errors), dev.log clean
- agent-browser QA sweep: 19 views desktop 1280 + mobile 390 → zero horizontal overflow, zero console errors → project STABLE → proceeded to feature round per mandate (no bugs to fix)

FEATURE A — Overview "แนวโน้มคุณภาพข้อมูล / Quality trend" card:
- New chart primitive RunTrendChart (charts.tsx): recharts ComposedChart with issue-count bars (red gradient) + pass-rate line (green, right % axis 0–100), top legend, optional onBarClick(index)
- Overview computes latest 10 runs (oldest→newest; "ล่าสุด 10 จาก {total} รอบ" badge when trimmed), x labels = locale short datetime (th-TH/en-GB), sr-only list gives an accessible text alternative per run (trendBarAria)
- Clicking a bar navigates to check-results?runId=… (verified with real Playwright click); empty state → CTA to run-quality-check; scope badge reuses honest real/mixed/simulated logic (attentionBadge)
- i18n keys data.overview.{trendTitle,trendDescription,trendEmpty,trendHint,trendShowing,trendBarAria} TH+EN

FEATURE B — Rule Statistics sheet (drill-down) in Rule Management:
- New BarChart3 icon action per rule row (first action, before Run/Edit/Duplicate/Delete) opens side Sheet (sm:max-w-lg, scrollable)
- Sheet contents: rule name + v-badge + severity/dimension/column badges; 4 StatCards (runs included, avg pass rate, issues found, last run / "ยังไม่เคยรัน"); honest version-mixed warning (statsVersionMixed) when any stored ruleResult.ruleVersion ≠ current rule.version; per-run breakdown table (dataset+date, rule version, pass rate, failed rows, issue count, arrow → click row opens run detail); latest 5 issues list (severity badge + dataset · column · #row + relative time, click → run); empty state CTA "รันตรวจด้วย Rule นี้"; session-scope honesty note
- All figures computed live from session checkRuns (ruleResults by ruleId + run.issues by ruleId); i18n dq.rules.stats* (~21 keys) TH+EN

FEATURE C — Human Review "undo decision":
- Per-row RotateCcw "ยกเลิกการตัดสินใจ / Undo decision" ghost button appears only when the row has a decision (keep/flag); tooltip explains reset-to-pending + session-only; calls upsertReview(runId, rowIndex, null) (store already supports null → reviewedAt null) + toast "ยกเลิกการตัดสินใจแล้ว"
- Verified: pending count 0→1 after undo, undo buttons 2→1; i18n ml.review.{clearAction,clearHint,clearedToast} TH+EN

FEATURE D — Issue Explorer severity persistence (exSev):
- ParamKey + parseHash whitelist + AppStore gained exSev; setExplorerFilters now accepts {severity} (same consolidated-preference contract as exDataset/exRun)
- Explorer: severity state initialized from store, chip toggle syncs store+hash; mount effect consumes exDataset/exRun/exSev hash params; toggle-off removes param; verified full matrix: click chip → `?exSev=critical`, reload → restored, toggle off → param removed, away+back → restored

Verification (agent-browser E2E, zero console errors throughout):
- Trend: 14 bars + 1 line rendered; real click on last bar → `#/check-results?runId=run_mv6f9ojf1229` (run detail); EN labels verified (Quality trend / Tip: click a bar / System Overview)
- Stats sheet: title "Email ห้ามว่าง v1" + 5 runs + per-run table (5 rows incl. version col) + latest issues + scope note; row click → `#/check-results?runId=…` and sheet closed; EN labels verified (Runs included / Per-run breakdown / session data)
- Undo: toast "ยกเลิกการตัดสินใจแล้ว #38" rendered; EN "Undo decision" verified; TH restored afterwards
- Overflow sweeps: modified views (overview, rule-management, human-review, issue-explorer, check-results, datasets) exactly 390 @390px; ALL 19 views exactly 1280 @1280px
- Dark mode verified on trend card (screenshot); TH↔EN verified on all new UI
- Artifacts: download/qa-r13-trend-desktop.png, qa-r13-trend-dark.png, qa-r13-trend-mobile.png, qa-r13-review-mobile.png, qa-r13-rule-stats-sheet.png, qa-r13-baseline-desktop.png

Stage Summary:
- Round 13 (stable phase → feature round): delivered cross-run trend visualization with drill-through on Overview, a full per-rule statistics drawer with version honesty (mixed-version warning), human-review decision undo, and completed the explorer deep-link story (exSev). All computations real from session data; Demo/real scope badges preserved; no new risks found.

Unresolved / risks / next-step recommendations:
- ML training/inference + PDF-direct remain simulated/disabled (by design); browser print covers PDF
- RuleStatsSheet notAssessedRows is computed but not displayed (table already dense) — candidate for tooltip
- explorer severity chip disabled-when-count-0 still shows stale store value if dataset/run filter changes make it empty (edge case: chip visually off, state persists as previously chosen severity) — self-corrects on next toggle; a store-clearing effect could tighten this
- Next good candidates: explorer entry-point cards on overview (per-dataset issue hotspots), ML flagged-rows tab in Issue Explorer, per-issue comment threads in inspector, or Web-Worker chunked engine execution for very large imports
