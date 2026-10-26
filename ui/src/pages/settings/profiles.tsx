import { CopyIcon, DownloadIcon, FileUpIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon, UserRoundCheckIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n, useStrings, type PageStrings } from "@/i18n"
import { callPy, py } from "@/lib/py"
import { cn } from "@/lib/utils"
import { useSettings } from "@/state/settings"

import { ConfirmDialog, downloadBlob } from "./shared"

const strings: PageStrings<
  | "title"
  | "desc"
  | "current"
  | "list"
  | "listDesc"
  | "active"
  | "switch"
  | "rename"
  | "duplicate"
  | "export"
  | "delete"
  | "create"
  | "createDesc"
  | "createPlaceholder"
  | "createButton"
  | "import"
  | "importDesc"
  | "chooseFile"
  | "importTitle"
  | "importFile"
  | "importName"
  | "importButton"
  | "renameTitle"
  | "renameDesc"
  | "duplicateTitle"
  | "duplicateDesc"
  | "newName"
  | "nameHint"
  | "deleteTitle"
  | "deleteDesc"
  | "needName"
  | "switched"
  | "created"
  | "renamed"
  | "duplicated"
  | "exported"
  | "deleted"
  | "imported"
  | "err.exists"
  | "err.empty"
  | "err.notFound"
  | "err.active"
  | "err.last"
  | "err.generic"
  | "loading"
  | "reload"
> = {
  ko: {
    title: "프로필",
    desc: "설정 묶음을 여러 개 저장해 두고 바꿔 가며 쓸 수 있어요. 프로필마다 설정, 필드 설정, 작업 우선순위가 따로 저장돼요.",
    current: "지금 쓰는 프로필",
    list: "내 프로필",
    listDesc: "다른 프로필로 바꾸면 지금 설정은 자동으로 저장돼요.",
    active: "사용 중",
    switch: "이걸로 바꾸기",
    rename: "이름 바꾸기",
    duplicate: "복제",
    export: "파일로 저장",
    delete: "삭제",
    create: "새 프로필 만들기",
    createDesc: "기본 설정으로 시작하는 새 프로필을 만들어요.",
    createPlaceholder: "프로필 이름",
    createButton: "만들기",
    import: "프로필 가져오기",
    importDesc: "저장해 둔 프로필 파일(.json)을 불러와 새 프로필로 추가해요.",
    chooseFile: "파일 고르기",
    importTitle: "프로필 가져오기",
    importFile: "고른 파일",
    importName: "새 프로필 이름",
    importButton: "가져오기",
    renameTitle: "'{name}' 이름 바꾸기",
    renameDesc: "새 이름을 입력해 주세요.",
    duplicateTitle: "'{name}' 복제하기",
    duplicateDesc: "똑같은 설정을 가진 프로필을 새 이름으로 만들어요.",
    newName: "새 이름",
    nameHint: "이름은 영문 소문자로 저장되고, 띄어쓰기는 _로 바뀌어요.",
    deleteTitle: "'{name}' 프로필을 삭제할까요?",
    deleteDesc: "삭제한 프로필은 되돌릴 수 없어요.",
    needName: "이름을 입력해 주세요.",
    switched: "'{name}' 프로필로 바꿨어요.",
    created: "'{name}' 프로필을 만들었어요.",
    renamed: "이름을 바꿨어요.",
    duplicated: "프로필을 복제했어요.",
    exported: "{file} 파일로 저장했어요.",
    deleted: "'{name}' 프로필을 삭제했어요.",
    imported: "프로필을 가져왔어요.",
    "err.exists": "같은 이름의 프로필이 이미 있어요.",
    "err.empty": "이름을 입력해 주세요.",
    "err.notFound": "프로필을 찾지 못했어요.",
    "err.active": "지금 쓰는 프로필은 삭제할 수 없어요.",
    "err.last": "하나 남은 프로필은 삭제할 수 없어요.",
    "err.generic": "문제가 생겼어요: {message}",
    loading: "불러오는 중…",
    reload: "목록 새로고침",
  },
  en: {
    title: "Profiles",
    desc: "Save several sets of settings and switch between them. Each profile keeps its own settings, field settings and task priorities.",
    current: "Current profile",
    list: "Your profiles",
    listDesc: "Switching saves your current settings automatically.",
    active: "Active",
    switch: "Switch",
    rename: "Rename",
    duplicate: "Duplicate",
    export: "Export",
    delete: "Delete",
    create: "Create a new profile",
    createDesc: "Creates a new profile with default settings.",
    createPlaceholder: "Profile name",
    createButton: "Create",
    import: "Import a profile",
    importDesc: "Load a profile file (.json) and add it as a new profile.",
    chooseFile: "Choose file",
    importTitle: "Import profile",
    importFile: "Selected file",
    importName: "New profile name",
    importButton: "Import",
    renameTitle: "Rename '{name}'",
    renameDesc: "Enter a new name.",
    duplicateTitle: "Duplicate '{name}'",
    duplicateDesc: "Creates a copy with the same settings under a new name.",
    newName: "New name",
    nameHint: "Names are saved in lower case, and spaces become _.",
    deleteTitle: "Delete the profile '{name}'?",
    deleteDesc: "This can't be undone.",
    needName: "Please enter a name.",
    switched: "Switched to '{name}'.",
    created: "Created '{name}'.",
    renamed: "Profile renamed.",
    duplicated: "Profile duplicated.",
    exported: "Saved as {file}.",
    deleted: "Deleted '{name}'.",
    imported: "Profile imported.",
    "err.exists": "A profile with that name already exists.",
    "err.empty": "Please enter a name.",
    "err.notFound": "That profile couldn't be found.",
    "err.active": "You can't delete the profile you're using.",
    "err.last": "You can't delete your only profile.",
    "err.generic": "Something went wrong: {message}",
    loading: "Loading…",
    reload: "Reload list",
  },
}

type Result = [boolean, string, string?]

/** Python names profiles in lower case with underscores. */
const sanitize = (name: string) => name.trim().replaceAll(" ", "_").toLowerCase()

type NameDialog = { kind: "rename" | "duplicate"; source: string } | null

export function ProfilesSection() {
  const t = useStrings(strings)
  const { t: tc } = useI18n()
  const { refresh } = useSettings()
  const [profiles, setProfiles] = useState<string[] | null>(null)
  const [current, setCurrent] = useState("")
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState("")
  const [nameDialog, setNameDialog] = useState<NameDialog>(null)
  const [dialogName, setDialogName] = useState("")
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importName, setImportName] = useState("imported_profile")
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const [list, cur] = await Promise.all([py.listProfiles(), py.getCurrentProfile()])
      setProfiles(Array.isArray(list) ? list : [])
      setCurrent(String(cur ?? ""))
    } catch (err) {
      console.error("[settings] listProfiles", err)
      toast.error(t("err.generic", { message: String(err) }))
      setProfiles([])
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  /** Turn Python's English messages into friendly text. */
  const explain = (message: string) => {
    const m = message.toLowerCase()
    if (m.includes("already exists")) return t("err.exists")
    if (m.includes("cannot be empty")) return t("err.empty")
    if (m.includes("not found")) return t("err.notFound")
    if (m.includes("currently active")) return t("err.active")
    if (m.includes("only remaining")) return t("err.last")
    return t("err.generic", { message })
  }

  /** Run a profile call that returns [ok, message]; returns ok. */
  const run = async (fn: string, args: unknown[], success: string) => {
    setBusy(true)
    try {
      const res = await callPy<Result>(fn, ...args)
      const [ok, message] = Array.isArray(res) ? res : [false, String(res)]
      if (ok) toast.success(success)
      else toast.error(explain(String(message ?? "")))
      return !!ok
    } catch (err) {
      console.error(`[settings] ${fn}`, err)
      toast.error(t("err.generic", { message: String(err) }))
      return false
    } finally {
      setBusy(false)
    }
  }

  const switchTo = async (name: string) => {
    if (await run("switchProfile", [name], t("switched", { name }))) {
      await refresh()
      await load()
    }
  }

  const create = async () => {
    const name = newName.trim()
    if (!name) return toast.error(t("needName"))
    if (await run("createProfile", [name], t("created", { name: sanitize(name) }))) {
      setNewName("")
      await load()
    }
  }

  const submitNameDialog = async () => {
    if (!nameDialog) return
    const name = dialogName.trim()
    if (!name) return toast.error(t("needName"))
    const ok =
      nameDialog.kind === "rename"
        ? await run("renameProfile", [nameDialog.source, name], t("renamed"))
        : await run("duplicateProfile", [nameDialog.source, name], t("duplicated"))
    if (!ok) return
    setNameDialog(null)
    // renaming the active profile changes where settings are read from
    if (nameDialog.kind === "rename" && nameDialog.source === current) await refresh()
    await load()
  }

  const remove = async (name: string) => {
    if (await run("deleteProfile", [name], t("deleted", { name }))) await load()
  }

  const exportOne = async (name: string) => {
    try {
      const res = await callPy<Result>("exportProfile", name)
      const [ok, content, filename] = Array.isArray(res) ? res : [false, String(res)]
      if (!ok) return toast.error(explain(String(content ?? "")))
      const file = filename || `${name}.json`
      downloadBlob(new Blob([content], { type: "application/json" }), file)
      toast.success(t("exported", { file }))
    } catch (err) {
      console.error("[settings] exportProfile", err)
      toast.error(t("err.generic", { message: String(err) }))
    }
  }

  const confirmImport = async () => {
    if (!importFile) return
    const name = importName.trim()
    if (!name) return toast.error(t("needName"))
    let content: string
    try {
      content = await importFile.text()
    } catch (err) {
      return toast.error(t("err.generic", { message: String(err) }))
    }
    if (await run("importProfileContent", [content, name], t("imported"))) {
      closeImport()
      await load()
    }
  }

  const closeImport = () => {
    setImportFile(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const openNameDialog = (kind: "rename" | "duplicate", source: string) => {
    setDialogName(kind === "rename" ? source : `${source}_copy`)
    setNameDialog({ kind, source })
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-primary/5 px-4 py-3">
            <UserRoundCheckIcon className="size-5 text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("current")}</p>
              <p className="truncate text-lg font-semibold">{profiles === null ? t("loading") : current}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{t("list")}</p>
                <p className="text-xs text-muted-foreground">{t("listDesc")}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={t("reload")} title={t("reload")} onClick={() => void load()}>
                <RefreshCwIcon />
              </Button>
            </div>
            <ul className="rm-stagger max-h-96 space-y-1.5 overflow-y-auto">
              {(profiles ?? []).map((name) => {
                const active = name === current
                return (
                  <li
                    key={name}
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
                      active ? "border-primary/60 bg-primary/5" : "bg-card",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                    {active && <Badge>{t("active")}</Badge>}
                    <div className="flex flex-wrap items-center gap-1">
                      {!active && (
                        <Button size="sm" disabled={busy} onClick={() => void switchTo(name)}>
                          {t("switch")}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" title={t("rename")} aria-label={t("rename")} disabled={busy} onClick={() => openNameDialog("rename", name)}>
                        <PencilIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title={t("duplicate")} aria-label={t("duplicate")} disabled={busy} onClick={() => openNameDialog("duplicate", name)}>
                        <CopyIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title={t("export")} aria-label={t("export")} onClick={() => void exportOne(name)}>
                        <DownloadIcon />
                      </Button>
                      {!active && (profiles?.length ?? 0) > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          title={t("delete")}
                          aria-label={t("delete")}
                          disabled={busy}
                          onClick={() => setToDelete(name)}
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("create")}</CardTitle>
            <CardDescription>{t("createDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void create()
              }}
            >
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("createPlaceholder")} autoComplete="off" spellCheck={false} />
              <Button type="submit" disabled={busy}>
                <PlusIcon />
                {t("createButton")}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("import")}</CardTitle>
            <CardDescription>{t("importDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setImportFile(file)
                setImportName("imported_profile")
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <FileUpIcon />
              {t("chooseFile")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* rename / duplicate */}
      <Dialog open={!!nameDialog} onOpenChange={(open) => !open && setNameDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nameDialog && t(nameDialog.kind === "rename" ? "renameTitle" : "duplicateTitle", { name: nameDialog.source })}
            </DialogTitle>
            <DialogDescription>{nameDialog?.kind === "duplicate" ? t("duplicateDesc") : t("renameDesc")}</DialogDescription>
          </DialogHeader>
          <form
            id="profile-name-form"
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              void submitNameDialog()
            }}
          >
            <Label htmlFor="profile-dialog-name">{t("newName")}</Label>
            <Input id="profile-dialog-name" value={dialogName} onChange={(e) => setDialogName(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialog(null)}>
              {tc("common.cancel")}
            </Button>
            <Button type="submit" form="profile-name-form" disabled={busy}>
              {nameDialog?.kind === "duplicate" ? t("duplicate") : t("rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* import */}
      <Dialog open={!!importFile} onOpenChange={(open) => !open && closeImport()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>
              {t("importFile")}: <span className="font-medium text-foreground">{importFile?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form
            id="profile-import-form"
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              void confirmImport()
            }}
          >
            <Label htmlFor="profile-import-name">{t("importName")}</Label>
            <Input
              id="profile-import-name"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              onFocus={(e) => e.target.select()}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={closeImport}>
              {tc("common.cancel")}
            </Button>
            <Button type="submit" form="profile-import-form" disabled={busy}>
              {t("importButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={toDelete ? t("deleteTitle", { name: toDelete }) : ""}
        description={t("deleteDesc")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={() => toDelete && void remove(toDelete)}
      />
    </div>
  )
}
