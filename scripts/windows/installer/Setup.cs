// Beolkkuri-Setup.exe: installs Beolkkuri for the current Windows user, without
// administrator rights. What it installs (the Python runtime, the macro and
// Beolkkuri.exe) is a zip that scripts/windows/build_installer.ps1 appends to this
// exe. Without that zip (uninstall.exe is a copy of this program) it removes
// Beolkkuri instead. Built with the C# 5 compiler in .NET Framework 4.
//
//   (no options)     install with the window
//   /S               install without a window; /D=<folder> picks the folder,
//                    /NoDesktop skips the desktop shortcut
//   /uninstall       remove Beolkkuri; with /S no window, /RemoveSettings also
//                    removes profiles and settings (kept by default)
//   /shot=<folder>   save every page as a PNG (docs and website), then exit;
//                    /lang=ko or /lang=en picks the language
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

static class Program
{
    [STAThread]
    static int Main(string[] args)
    {
        Options options = Options.Parse(args);
        if (options.Language != null) L.Korean = options.Language == "ko";
        Log.Start();
        Payload payload = Payload.Open(Application.ExecutablePath);
        Log.Write("Setup started: " + string.Join(" ", args) + (payload == null ? " (no payload)" : " (version " + payload.Version + ")"));

        if (options.ShotFolder != null)
        {
            Application.EnableVisualStyles();
            SetupForm.SaveShots(options.ShotFolder, payload);
            return 0;
        }

        if (payload == null || options.Uninstall)
        {
            string target = options.Target ?? Installer.FindInstalled();
            if (target == null)
            {
                if (!options.Silent) MessageBox.Show(L.T("설치된 벌꿀이를 찾지 못했어요.", "Beolkkuri is not installed."), "Beolkkuri");
                return 1;
            }
            // Run from a temporary copy, so the install folder (and uninstall.exe in it) can be deleted.
            if (!options.FromTemp) return Uninstaller.RelaunchFromTemp(target, options);
            int code = 0;
            if (options.Silent) code = Uninstaller.Run(target, options.RemoveSettings, null) ? 0 : 1;
            else RunWindow(new SetupForm(null, target, true));
            Uninstaller.DeleteSelfLater();
            return code;
        }

        if (options.Silent)
        {
            var installer = new Installer(payload);
            bool ok = installer.Run(options.Target ?? Installer.DefaultFolder(), !options.NoDesktop, null);
            return ok ? 0 : 1;
        }
        RunWindow(new SetupForm(payload, null, false));
        return 0;
    }

    static void RunWindow(Form form)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(form);
    }
}

sealed class Options
{
    public bool Silent, Uninstall, FromTemp, RemoveSettings, NoDesktop;
    public string Target, ShotFolder, Language;

    public static Options Parse(string[] args)
    {
        var options = new Options();
        foreach (string arg in args)
        {
            string lower = arg.ToLowerInvariant();
            if (lower == "/s") options.Silent = true;
            else if (lower == "/uninstall") options.Uninstall = true;
            else if (lower == "/fromtemp") options.FromTemp = true;
            else if (lower == "/removesettings") options.RemoveSettings = true;
            else if (lower == "/nodesktop") options.NoDesktop = true;
            else if (lower.StartsWith("/d=")) options.Target = arg.Substring(3);
            else if (lower.StartsWith("/target=")) options.Target = arg.Substring(8);
            else if (lower.StartsWith("/shot=")) options.ShotFolder = arg.Substring(6);
            else if (lower.StartsWith("/lang=")) options.Language = lower.Substring(6);
        }
        if (options.Target != null) options.Target = Path.GetFullPath(options.Target.Trim('"')).TrimEnd('\\');
        return options;
    }
}

// Korean on Korean Windows, English everywhere else.
static class L
{
    public static bool Korean = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "ko";
    public static string T(string korean, string english) { return Korean ? korean : english; }
}

static class Log
{
    public static readonly string Path = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "Beolkkuri-Setup.log");
    static readonly object Lock = new object();

    public static void Start()
    {
        try { File.WriteAllText(Path, "Beolkkuri setup log " + DateTime.Now.ToString("s") + Environment.NewLine, Encoding.UTF8); }
        catch (Exception) { }
    }

    public static void Write(string line)
    {
        lock (Lock)
        {
            try { File.AppendAllText(Path, DateTime.Now.ToString("HH:mm:ss ") + line + Environment.NewLine, Encoding.UTF8); }
            catch (Exception) { }
        }
    }
}

// ---------------------------------------------------------------------------
// The appended zip: [stub exe][zip][zip length: 8 bytes][magic: 8 bytes]
// ---------------------------------------------------------------------------
sealed class Payload
{
    const string Magic = "BKPAYLD1";
    public string ExePath;
    public long StubLength;
    long offset, length;
    public string Version = "?";
    public long InstalledBytes;
    public int FileCount;

    public static Payload Open(string exe)
    {
        try
        {
            using (var file = new FileStream(exe, FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                if (file.Length < 16) return null;
                var tail = new byte[16];
                file.Seek(-16, SeekOrigin.End);
                if (file.Read(tail, 0, 16) != 16 || Encoding.ASCII.GetString(tail, 8, 8) != Magic) return null;
                var payload = new Payload();
                payload.ExePath = exe;
                payload.length = BitConverter.ToInt64(tail, 0);
                payload.offset = file.Length - 16 - payload.length;
                if (payload.length <= 0 || payload.offset <= 0) return null;
                payload.StubLength = payload.offset;
                using (ZipArchive zip = payload.OpenZip())
                {
                    foreach (ZipArchiveEntry entry in zip.Entries)
                    {
                        payload.InstalledBytes += entry.Length;
                        if (!IsFolder(entry)) payload.FileCount++;
                        if (Installer.EntryPath(entry) == "src/webapp/version.txt")
                        {
                            using (var reader = new StreamReader(entry.Open())) payload.Version = reader.ReadToEnd().Trim();
                        }
                    }
                }
                return payload;
            }
        }
        catch (Exception e)
        {
            Log.Write("No payload: " + e.Message);
            return null;
        }
    }

    public ZipArchive OpenZip()
    {
        var file = new FileStream(ExePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return new ZipArchive(new SubStream(file, offset, length), ZipArchiveMode.Read, false);
    }

    public static bool IsFolder(ZipArchiveEntry entry) { return entry.FullName.EndsWith("/") || entry.FullName.EndsWith("\\"); }
}

// A read-only window into part of a stream, so ZipArchive can read the zip inside the exe.
sealed class SubStream : Stream
{
    readonly Stream inner;
    readonly long start, length;
    long position;

    public SubStream(Stream inner, long start, long length) { this.inner = inner; this.start = start; this.length = length; }
    public override bool CanRead { get { return true; } }
    public override bool CanSeek { get { return true; } }
    public override bool CanWrite { get { return false; } }
    public override long Length { get { return length; } }
    public override long Position { get { return position; } set { position = value; } }
    public override void Flush() { }
    public override void SetLength(long value) { throw new NotSupportedException(); }
    public override void Write(byte[] buffer, int offset, int count) { throw new NotSupportedException(); }

    public override int Read(byte[] buffer, int offset, int count)
    {
        long left = length - position;
        if (left <= 0) return 0;
        if (count > left) count = (int)left;
        inner.Position = start + position;
        int read = inner.Read(buffer, offset, count);
        position += read;
        return read;
    }

    public override long Seek(long offset, SeekOrigin origin)
    {
        if (origin == SeekOrigin.Begin) position = offset;
        else if (origin == SeekOrigin.Current) position += offset;
        else position = length + offset;
        return position;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing) inner.Dispose();
        base.Dispose(disposing);
    }
}

// ---------------------------------------------------------------------------
// Installing and removing
// ---------------------------------------------------------------------------
delegate void Progress(double fraction, string status);

static class Shared
{
    public const string RegistryKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Beolkkuri";
    public const string ShortcutName = "벌꿀이.lnk";

    // End Beolkkuri.exe and the Python processes of the install in this folder.
    public static void StopRunning(string folder)
    {
        StopProcesses("Beolkkuri", Path.Combine(folder, "Beolkkuri.exe"));
        StopProcesses("python", Path.Combine(folder, @"runtime\python.exe"));
    }

    static void StopProcesses(string name, string path)
    {
        foreach (Process process in Process.GetProcessesByName(name))
        {
            try
            {
                if (!string.Equals(process.MainModule.FileName, path, StringComparison.OrdinalIgnoreCase)) continue;
                Log.Write("Stopping " + path + " (" + process.Id + ")");
                process.Kill();
                process.WaitForExit(5000);
            }
            catch (Exception) { }
            finally { process.Dispose(); }
        }
    }

    public static string[] ShortcutPaths()
    {
        return new[] {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), ShortcutName),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), ShortcutName),
        };
    }

    // WScript.Shell through late binding, so no extra assembly is needed.
    public static object Shortcut(string path)
    {
        Type type = Type.GetTypeFromProgID("WScript.Shell");
        object shell = Activator.CreateInstance(type);
        return type.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { path });
    }

    public static void Set(object target, string property, object value)
    {
        target.GetType().InvokeMember(property, BindingFlags.SetProperty, null, target, new[] { value });
    }

    public static string Get(object target, string property)
    {
        return Convert.ToString(target.GetType().InvokeMember(property, BindingFlags.GetProperty, null, target, null));
    }

    // Directory.Delete fails now and then while Windows or an antivirus still holds a file.
    public static void DeleteFolder(string folder)
    {
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                if (!Directory.Exists(folder)) return;
                foreach (string file in Directory.GetFiles(folder, "*", SearchOption.AllDirectories))
                    File.SetAttributes(file, FileAttributes.Normal);
                Directory.Delete(folder, true);
                return;
            }
            catch (Exception)
            {
                if (attempt == 6) throw;
                Thread.Sleep(500 * attempt);
            }
        }
    }

    public static void CopyStub(Payload payload, string destination)
    {
        string source = payload != null ? payload.ExePath : Application.ExecutablePath;
        long length = payload != null ? payload.StubLength : new FileInfo(source).Length;
        using (var input = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read))
        using (var output = new FileStream(destination, FileMode.Create, FileAccess.Write))
        {
            var buffer = new byte[81920];
            while (length > 0)
            {
                int read = input.Read(buffer, 0, (int)Math.Min(buffer.Length, length));
                if (read <= 0) break;
                output.Write(buffer, 0, read);
                length -= read;
            }
        }
    }

    public static bool IsInside(string path, string folder)
    {
        return path.StartsWith(folder.TrimEnd('\\') + "\\", StringComparison.OrdinalIgnoreCase);
    }
}

sealed class SetupException : Exception
{
    public SetupException(string message) : base(message) { }
}

sealed class Installer
{
    readonly Payload payload;
    public string Error;
    public bool ImportedSettings;

    public Installer(Payload payload) { this.payload = payload; }

    public static string DefaultFolder()
    {
        string installed = FindInstalled();
        if (installed != null) return installed;
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\Beolkkuri");
    }

    public static string FindInstalled()
    {
        try
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(Shared.RegistryKey))
            {
                string folder = key == null ? null : key.GetValue("InstallLocation") as string;
                if (!string.IsNullOrEmpty(folder) && File.Exists(Path.Combine(folder, "Beolkkuri.exe"))) return folder;
            }
        }
        catch (Exception) { }
        string self = Path.GetDirectoryName(Application.ExecutablePath);
        if (File.Exists(Path.Combine(self, "Beolkkuri.exe")) && File.Exists(Path.Combine(self, @"src\main.py"))) return self;
        return null;
    }

    public static string EntryPath(ZipArchiveEntry entry) { return entry.FullName.Replace('\\', '/'); }

    // The user's own copies win over the shipped ones (the in-app updater adds new
    // patterns the same way); everything else is replaced.
    static bool KeepExisting(string entryPath)
    {
        return entryPath.StartsWith("settings/patterns/") || entryPath.StartsWith("settings/profiles/") || entryPath.StartsWith("src/data/user/");
    }

    public bool Run(string folder, bool desktopShortcut, Progress progress)
    {
        try
        {
            Install(folder.TrimEnd('\\'), desktopShortcut, progress ?? delegate { });
            return true;
        }
        catch (Exception e)
        {
            Log.Write("Install failed: " + e);
            Error = e is SetupException ? e.Message : L.T("파일을 설치하지 못했어요: ", "Could not install the files: ") + e.Message;
            return false;
        }
    }

    void Install(string folder, bool desktopShortcut, Progress progress)
    {
        Log.Write("Installing " + payload.Version + " to " + folder);
        Version os = Environment.OSVersion.Version;
        if (!Environment.Is64BitOperatingSystem || os.Major < 10 || os.Build < 17763)
            throw new SetupException(L.T("이 PC에서는 쓸 수 없어요. 64비트 Windows 10(1809) 이상이 필요해요.",
                                         "Beolkkuri needs 64-bit Windows 10 (1809) or later."));
        progress(0, L.T("준비하는 중", "Getting ready"));
        try
        {
            Directory.CreateDirectory(folder);
            string probe = Path.Combine(folder, ".beolkkuri-write-test");
            File.WriteAllText(probe, "");
            File.Delete(probe);
        }
        catch (Exception e)
        {
            Log.Write("Folder not writable: " + e.Message);
            throw new SetupException(L.T("이 폴더에는 설치할 수 없어요. 다른 폴더를 골라 주세요.", "Can't install into this folder. Please choose another one."));
        }
        try
        {
            long free = new DriveInfo(Path.GetPathRoot(folder)).AvailableFreeSpace;
            if (free < payload.InstalledBytes + (200L << 20))
                throw new SetupException(string.Format(L.T("디스크 공간이 부족해요. {0}가 더 필요해요.", "Not enough disk space. Beolkkuri needs {0} more."),
                                                       SetupForm.FormatSize(payload.InstalledBytes + (200L << 20) - free)));
        }
        catch (SetupException) { throw; }
        catch (Exception) { }

        progress(0.01, L.T("열려 있는 벌꿀이를 닫는 중", "Closing Beolkkuri"));
        Shared.StopRunning(folder);
        // A new runtime replaces the old one completely, so removed packages don't linger.
        string runtime = Path.Combine(folder, "runtime");
        if (Directory.Exists(runtime))
        {
            progress(0.02, L.T("이전 버전을 정리하는 중", "Removing the previous version"));
            try { Shared.DeleteFolder(runtime); }
            catch (Exception e)
            {
                Log.Write("Could not remove runtime: " + e.Message);
                throw new SetupException(L.T("이전 버전의 파일이 사용 중이에요. 벌꿀이를 닫고 다시 시도해 주세요.",
                                             "Files of the previous version are in use. Close Beolkkuri and try again."));
            }
        }

        Extract(folder, progress);

        progress(0.97, L.T("바로가기를 만드는 중", "Creating shortcuts"));
        try { File.Delete(Path.Combine(folder, @"src\webapp\updated_commit.txt")); } catch (Exception) { }
        ImportScriptInstall(folder);
        Shared.CopyStub(payload, Path.Combine(folder, "uninstall.exe"));
        string[] shortcuts = Shared.ShortcutPaths();
        CreateShortcut(shortcuts[0], folder);
        if (desktopShortcut) CreateShortcut(shortcuts[1], folder);
        Register(folder);
        progress(1, L.T("다 됐어요", "Done"));
        Log.Write("Installed");
    }

    void Extract(string folder, Progress progress)
    {
        long done = 0;
        int lastStep = -1;
        var buffer = new byte[1 << 16];
        using (ZipArchive zip = payload.OpenZip())
        {
            foreach (ZipArchiveEntry entry in zip.Entries)
            {
                string name = EntryPath(entry);
                string destination = Path.GetFullPath(Path.Combine(folder, name.Replace('/', '\\')));
                if (!Shared.IsInside(destination, folder)) throw new SetupException("Bad file name in the installer: " + name);
                if (Payload.IsFolder(entry))
                {
                    Directory.CreateDirectory(destination);
                    continue;
                }
                if (!(KeepExisting(name) && File.Exists(destination)))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(destination));
                    WriteFile(entry, destination, buffer);
                }
                done += entry.Length;
                int step = (int)(done * 1000 / Math.Max(1, payload.InstalledBytes));
                if (step != lastStep)
                {
                    lastStep = step;
                    progress(0.03 + 0.93 * step / 1000.0, L.T("파일을 복사하는 중", "Copying files"));
                }
            }
        }
    }

    static void WriteFile(ZipArchiveEntry entry, string destination, byte[] buffer)
    {
        for (int attempt = 1; ; attempt++)
        {
            try
            {
                if (File.Exists(destination)) File.SetAttributes(destination, FileAttributes.Normal);
                using (Stream input = entry.Open())
                using (var output = new FileStream(destination, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    int read;
                    while ((read = input.Read(buffer, 0, buffer.Length)) > 0) output.Write(buffer, 0, read);
                }
                File.SetLastWriteTime(destination, entry.LastWriteTime.DateTime);
                return;
            }
            catch (IOException e)
            {
                if (attempt == 4)
                {
                    Log.Write("Could not write " + destination + ": " + e.Message);
                    throw new SetupException(L.T("파일이 사용 중이라 바꾸지 못했어요. 벌꿀이를 닫고 다시 시도해 주세요.",
                                                 "A file is in use and could not be replaced. Close Beolkkuri and try again."));
                }
                Thread.Sleep(400 * attempt);
            }
        }
    }

    // Someone moving from the PowerShell install (%USERPROFILE%\Beolkkuri) keeps their profiles.
    void ImportScriptInstall(string folder)
    {
        string old = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Beolkkuri");
        if (string.Equals(old, folder, StringComparison.OrdinalIgnoreCase)) return;
        try
        {
            if (Directory.Exists(Path.Combine(old, @"settings\profiles")) && !Directory.Exists(Path.Combine(folder, @"settings\profiles")))
            {
                CopyFolder(Path.Combine(old, @"settings\profiles"), Path.Combine(folder, @"settings\profiles"), null);
                // Recordings can be gigabytes; they stay where they are.
                CopyFolder(Path.Combine(old, @"src\data\user"), Path.Combine(folder, @"src\data\user"), "robin_ai_recordings");
                CopyFolder(Path.Combine(old, @"settings\patterns"), Path.Combine(folder, @"settings\patterns"), null);
                ImportedSettings = true;
                Log.Write("Imported settings from " + old);
            }
        }
        catch (Exception e)
        {
            Log.Write("Could not import settings: " + e.Message);
        }
    }

    // Copies files that are missing in the destination.
    static void CopyFolder(string source, string destination, string skip)
    {
        if (!Directory.Exists(source)) return;
        Directory.CreateDirectory(destination);
        foreach (string file in Directory.GetFiles(source))
        {
            string target = Path.Combine(destination, Path.GetFileName(file));
            if (!File.Exists(target)) File.Copy(file, target);
        }
        foreach (string child in Directory.GetDirectories(source))
        {
            if (skip != null && string.Equals(Path.GetFileName(child), skip, StringComparison.OrdinalIgnoreCase)) continue;
            CopyFolder(child, Path.Combine(destination, Path.GetFileName(child)), null);
        }
    }

    static void CreateShortcut(string path, string folder)
    {
        try
        {
            object shortcut = Shared.Shortcut(path);
            Shared.Set(shortcut, "TargetPath", Path.Combine(folder, "Beolkkuri.exe"));
            Shared.Set(shortcut, "WorkingDirectory", folder);
            Shared.Set(shortcut, "IconLocation", Path.Combine(folder, "Beolkkuri.exe") + ",0");
            Shared.Set(shortcut, "Description", L.T("벌꿀이 · 비 스웜 시뮬레이터 매크로", "Beolkkuri · Bee Swarm Simulator macro"));
            shortcut.GetType().InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
        }
        catch (Exception e)
        {
            Log.Write("Could not create " + path + ": " + e.Message);
        }
    }

    void Register(string folder)
    {
        using (RegistryKey key = Registry.CurrentUser.CreateSubKey(Shared.RegistryKey))
        {
            key.SetValue("DisplayName", "벌꿀이 (Beolkkuri)");
            key.SetValue("DisplayVersion", payload.Version);
            key.SetValue("Publisher", "Yoon-robin");
            key.SetValue("DisplayIcon", Path.Combine(folder, "Beolkkuri.exe") + ",0");
            key.SetValue("InstallLocation", folder);
            key.SetValue("UninstallString", "\"" + Path.Combine(folder, "uninstall.exe") + "\" /uninstall");
            key.SetValue("QuietUninstallString", "\"" + Path.Combine(folder, "uninstall.exe") + "\" /uninstall /S");
            key.SetValue("URLInfoAbout", "https://yoon-robin.github.io/Beolkkuri/");
            key.SetValue("HelpLink", "https://github.com/Yoon-robin/Beolkkuri/issues");
            key.SetValue("InstallDate", DateTime.Now.ToString("yyyyMMdd"));
            key.SetValue("EstimatedSize", (int)(payload.InstalledBytes / 1024), RegistryValueKind.DWord);
            key.SetValue("NoModify", 1, RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
    }
}

static class Uninstaller
{
    // What "keep my settings" leaves behind; installing again picks them up.
    static readonly string[] SettingsFolders = { @"settings\profiles", @"settings\patterns", @"src\data\user" };

    public static int RelaunchFromTemp(string target, Options options)
    {
        string copy = Path.Combine(Path.GetTempPath(), "Beolkkuri-uninstall-" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".exe");
        Shared.CopyStub(Payload.Open(Application.ExecutablePath), copy);
        string arguments = "/uninstall /fromtemp \"/target=" + target + "\"";
        if (options.Silent) arguments += " /S";
        if (options.RemoveSettings) arguments += " /RemoveSettings";
        if (options.Language != null) arguments += " /lang=" + options.Language;
        var start = new ProcessStartInfo(copy, arguments);
        start.UseShellExecute = false;
        start.WorkingDirectory = Path.GetTempPath();
        Process.Start(start);
        return 0;
    }

    public static bool Run(string folder, bool removeSettings, Progress progress)
    {
        if (progress == null) progress = delegate { };
        try
        {
            Log.Write("Uninstalling " + folder + (removeSettings ? " with settings" : ""));
            progress(0.05, L.T("열려 있는 벌꿀이를 닫는 중", "Closing Beolkkuri"));
            Shared.StopRunning(folder);
            foreach (string path in Shared.ShortcutPaths())
            {
                try
                {
                    if (File.Exists(path) && Shared.IsInside(Shared.Get(Shared.Shortcut(path), "TargetPath"), folder)) File.Delete(path);
                }
                catch (Exception e) { Log.Write("Could not remove " + path + ": " + e.Message); }
            }
            progress(0.2, L.T("파일을 지우는 중", "Removing files"));
            if (removeSettings) Shared.DeleteFolder(folder);
            else DeleteExcept(folder, folder);
            Registry.CurrentUser.DeleteSubKeyTree(Shared.RegistryKey, false);
            progress(1, L.T("다 됐어요", "Done"));
            Log.Write("Uninstalled");
            return true;
        }
        catch (Exception e)
        {
            Log.Write("Uninstall failed: " + e);
            return false;
        }
    }

    static void DeleteExcept(string folder, string root)
    {
        foreach (string file in Directory.GetFiles(folder))
        {
            File.SetAttributes(file, FileAttributes.Normal);
            File.Delete(file);
        }
        foreach (string child in Directory.GetDirectories(folder))
        {
            string relative = child.Substring(root.Length + 1);
            bool keep = false, holdsKept = false;
            foreach (string kept in SettingsFolders)
            {
                if (string.Equals(kept, relative, StringComparison.OrdinalIgnoreCase)) keep = true;
                else if (kept.StartsWith(relative + "\\", StringComparison.OrdinalIgnoreCase)) holdsKept = true;
            }
            if (keep) continue;
            if (holdsKept) DeleteExcept(child, root);
            else Shared.DeleteFolder(child);
        }
    }

    public static bool HasKeptSettings(string folder)
    {
        return Directory.Exists(Path.Combine(folder, @"settings\profiles"));
    }

    // This copy runs from %TEMP%; remove it once it has exited.
    public static void DeleteSelfLater()
    {
        try
        {
            var start = new ProcessStartInfo("cmd.exe", "/c ping 127.0.0.1 -n 3 > nul & del /f /q \"" + Application.ExecutablePath + "\"");
            start.CreateNoWindow = true;
            start.UseShellExecute = false;
            Process.Start(start);
        }
        catch (Exception) { }
    }
}

// ---------------------------------------------------------------------------
// The window. Everything is painted by hand in the website's style: honey
// background, ink outlines and hard shadows. Coordinates are at 96 DPI and
// scaled when painting.
// ---------------------------------------------------------------------------
static class Theme
{
    public static readonly Color Honey = Color.FromArgb(0xff, 0xc8, 0x3d);
    public static readonly Color HoneySoft = Color.FromArgb(0xff, 0xe7, 0xa3);
    public static readonly Color Amber = Color.FromArgb(0xf0, 0x8a, 0x00);
    public static readonly Color Ink = Color.FromArgb(0x1c, 0x14, 0x09);
    public static readonly Color Paper = Color.FromArgb(0xff, 0xfa, 0xee);
    public static readonly Color Muted = Color.FromArgb(0x6b, 0x5a, 0x3e);
    public static readonly Color Red = Color.FromArgb(0xff, 0x5b, 0x4a);

    public static FontFamily Display, Body;
    static PrivateFontCollection fonts;

    public static void Load()
    {
        if (Body != null) return;
        Body = Family("Malgun Gothic") ?? Family("Segoe UI") ?? SystemFonts.MessageBoxFont.FontFamily;
        try
        {
            byte[] data = Resource("title.ttf");
            if (data != null)
            {
                // GDI+ reads the font from this memory for as long as it is used, so it is never freed.
                IntPtr memory = Marshal.AllocCoTaskMem(data.Length);
                Marshal.Copy(data, 0, memory, data.Length);
                fonts = new PrivateFontCollection();
                fonts.AddMemoryFont(memory, data.Length);
                Display = fonts.Families[0];
            }
        }
        catch (Exception e) { Log.Write("Display font unavailable: " + e.Message); }
    }

    static FontFamily Family(string name)
    {
        try { return new FontFamily(name); }
        catch (ArgumentException) { return null; }
    }

    // Black Han Sans for headings, or bold body text without it.
    public static Font Heading(float pixels)
    {
        return Display != null ? new Font(Display, pixels, FontStyle.Regular, GraphicsUnit.Pixel) : new Font(Body, pixels, FontStyle.Bold, GraphicsUnit.Pixel);
    }

    public static Font Text(float pixels, bool bold)
    {
        return new Font(Body, pixels, bold ? FontStyle.Bold : FontStyle.Regular, GraphicsUnit.Pixel);
    }

    // Korean fonts draw "\" as a won sign, so paths use Segoe UI (Windows links it to a Korean font for Hangul).
    public static Font Path(float pixels)
    {
        FontFamily family = Family("Segoe UI") ?? Body;
        return new Font(family, pixels, FontStyle.Regular, GraphicsUnit.Pixel);
    }

    public static byte[] Resource(string name)
    {
        using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
        {
            if (stream == null) return null;
            var memory = new MemoryStream();
            stream.CopyTo(memory);
            return memory.ToArray();
        }
    }

    public static Image Image(string name)
    {
        byte[] data = Resource(name);
        return data == null ? null : System.Drawing.Image.FromStream(new MemoryStream(data));
    }

    public static GraphicsPath Rounded(RectangleF r, float radius)
    {
        var path = new GraphicsPath();
        float d = radius * 2;
        path.AddArc(r.X, r.Y, d, d, 180, 90);
        path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    // A card with an ink outline and a hard shadow down and to the right.
    public static void Card(Graphics g, RectangleF r, float radius, Color fill, float shadow, Color shadowColor, float border)
    {
        if (shadow > 0)
        {
            using (GraphicsPath path = Rounded(new RectangleF(r.X + shadow, r.Y + shadow, r.Width, r.Height), radius))
            using (var brush = new SolidBrush(shadowColor)) g.FillPath(brush, path);
        }
        using (GraphicsPath path = Rounded(r, radius))
        {
            using (var brush = new SolidBrush(fill)) g.FillPath(brush, path);
            using (var pen = new Pen(Ink, border)) g.DrawPath(pen, path);
        }
    }
}

enum Page { Install, Progress, Done, Failed, Remove, Removing, Removed }

abstract class Widget
{
    public RectangleF Bounds;
    public bool Hover, Pressed;
    public Action Click;
    public abstract void Paint(Graphics g);
}

sealed class ButtonWidget : Widget
{
    public string Text;
    public bool Primary;

    public override void Paint(Graphics g)
    {
        // Like the website's .btn: lifts on hover, sinks into its shadow when pressed.
        float lift = Pressed ? -4 : Hover ? 2 : 0;
        float shadow = Pressed ? 1 : Hover ? 7 : 5;
        var r = new RectangleF(Bounds.X - lift, Bounds.Y - lift, Bounds.Width, Bounds.Height);
        Theme.Card(g, r, 14, Primary ? Theme.Ink : Color.White, shadow, Primary ? Theme.Red : Theme.Ink, 3);
        using (Font font = Primary ? Theme.Heading(19) : Theme.Text(15, true))
        using (var brush = new SolidBrush(Primary ? Theme.Honey : Theme.Ink))
        using (var format = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
            g.DrawString(Text, font, brush, new RectangleF(r.X, r.Y + (Primary ? 4 : 0), r.Width, r.Height), format);
    }
}

sealed class CheckWidget : Widget
{
    public string Text;
    public bool Checked;

    public override void Paint(Graphics g)
    {
        var box = new RectangleF(Bounds.X, Bounds.Y + (Bounds.Height - 22) / 2, 22, 22);
        Theme.Card(g, box, 6, Checked ? Theme.Ink : Color.White, Hover ? 3 : 2, Theme.Ink, 2.5f);
        if (Checked)
        {
            using (var pen = new Pen(Theme.Honey, 3) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
                g.DrawLines(pen, new[] { new PointF(box.X + 5.5f, box.Y + 11.5f), new PointF(box.X + 9.5f, box.Y + 15.5f), new PointF(box.X + 16.5f, box.Y + 7f) });
        }
        using (Font font = Theme.Text(14, false))
        using (var brush = new SolidBrush(Theme.Ink))
        using (var format = new StringFormat { LineAlignment = StringAlignment.Center })
            g.DrawString(Text, font, brush, new RectangleF(Bounds.X + 32, Bounds.Y, Bounds.Width - 32, Bounds.Height), format);
    }
}

sealed class CloseWidget : Widget
{
    public override void Paint(Graphics g)
    {
        Theme.Card(g, Bounds, Bounds.Width / 2, Hover ? Theme.HoneySoft : Theme.Paper, Pressed ? 0 : 2.5f, Theme.Ink, 2.5f);
        float c = Bounds.Width / 2, s = 5.5f;
        using (var pen = new Pen(Theme.Ink, 2.5f) { StartCap = LineCap.Round, EndCap = LineCap.Round })
        {
            g.DrawLine(pen, Bounds.X + c - s, Bounds.Y + c - s, Bounds.X + c + s, Bounds.Y + c + s);
            g.DrawLine(pen, Bounds.X + c + s, Bounds.Y + c - s, Bounds.X + c - s, Bounds.Y + c + s);
        }
    }
}

sealed class SetupForm : Form
{
    const int W = 640, H = 460;
    readonly Payload payload;
    string folder;
    readonly bool uninstall;
    float scale = 1;
    Page page;
    double fraction;
    string status = "", error = "";
    bool busy, removedWithSettings, imported;
    int frame;
    readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer { Interval = 33 };
    readonly bool animate = SystemInformation.UIEffectsEnabled;
    readonly Image logo, bee;
    readonly List<Widget> widgets = new List<Widget>();
    readonly CloseWidget close = new CloseWidget();
    readonly CheckWidget desktop = new CheckWidget { Checked = true };
    readonly CheckWidget removeSettings = new CheckWidget();
    Widget pressed;
    ButtonWidget primary, secondary;

    public SetupForm(Payload payload, string installedFolder, bool uninstall)
    {
        Theme.Load();
        this.payload = payload;
        this.uninstall = uninstall;
        folder = installedFolder ?? Installer.DefaultFolder();
        logo = Theme.Image("logo.png");
        bee = Theme.Image("bee.png");
        Text = uninstall ? L.T("벌꿀이 지우기", "Uninstall Beolkkuri") : L.T("벌꿀이 설치", "Beolkkuri Setup");
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        DoubleBuffered = true;
        KeyPreview = true;
        BackColor = Theme.Honey;
        using (Graphics g = CreateGraphics()) scale = g.DpiX / 96f;
        ClientSize = new Size((int)Math.Round(W * scale), (int)Math.Round(H * scale));
        close.Bounds = new RectangleF(W - 52, 40, 30, 30);
        close.Click = Close;
        desktop.Text = L.T("바탕화면에 바로가기 만들기", "Add a desktop shortcut");
        desktop.Click = delegate { desktop.Checked = !desktop.Checked; };
        removeSettings.Text = L.T("프로필과 설정도 함께 지우기", "Also remove my profiles and settings");
        removeSettings.Click = delegate { removeSettings.Checked = !removeSettings.Checked; };
        timer.Tick += delegate { frame++; Invalidate(); };
        GoTo(uninstall ? Page.Remove : Page.Install);
    }

    protected override CreateParams CreateParams
    {
        get
        {
            CreateParams p = base.CreateParams;
            p.ClassStyle |= 0x20000;   // CS_DROPSHADOW
            p.Style |= 0x20000;        // WS_MINIMIZEBOX: minimize and restore from the taskbar
            return p;
        }
    }

    bool Upgrading { get { return File.Exists(Path.Combine(folder, "Beolkkuri.exe")); } }

    // ---- pages ----------------------------------------------------------

    void GoTo(Page next)
    {
        page = next;
        widgets.Clear();
        primary = secondary = null;
        bool closable = next != Page.Progress && next != Page.Removing;
        if (closable) widgets.Add(close);
        switch (next)
        {
            case Page.Install:
                primary = Button(Upgrading ? L.T("업데이트하기", "Update") : L.T("설치하기", "Install"), true, 40, 360, 190, StartInstall);
                var change = Button(L.T("바꾸기", "Change"), false, 506, 252, 82, ChooseFolder);
                change.Bounds.Height = 38;
                desktop.Bounds = new RectangleF(64, 306, 330, 28);
                widgets.Add(desktop);
                break;
            case Page.Done:
                primary = Button(L.T("벌꿀이 열기", "Open Beolkkuri"), true, 40, 360, 190, OpenAndClose);
                secondary = Button(L.T("닫기", "Close"), false, 248, 360, 110, Close);
                break;
            case Page.Failed:
                primary = Button(L.T("다시 시도", "Try again"), true, 40, 360, 170, delegate { GoTo(uninstall ? Page.Remove : Page.Install); });
                secondary = Button(L.T("닫기", "Close"), false, 228, 360, 110, Close);
                break;
            case Page.Remove:
                removeSettings.Bounds = new RectangleF(40, 256, 420, 28);
                widgets.Add(removeSettings);
                primary = Button(L.T("지우기", "Uninstall"), true, 40, 360, 170, StartRemove);
                secondary = Button(L.T("취소", "Cancel"), false, 228, 360, 110, Close);
                break;
            case Page.Removed:
                primary = Button(L.T("닫기", "Close"), true, 40, 360, 150, Close);
                break;
        }
        if (animate && (next == Page.Progress || next == Page.Removing)) timer.Start();
        else timer.Stop();
        Invalidate();
    }

    ButtonWidget Button(string text, bool isPrimary, float x, float y, float width, Action click)
    {
        var button = new ButtonWidget { Text = text, Primary = isPrimary, Click = click, Bounds = new RectangleF(x, y, width, 52) };
        widgets.Add(button);
        return button;
    }

    void ChooseFolder()
    {
        string chosen = FolderPicker.Pick(Handle, L.T("벌꿀이를 설치할 폴더를 골라 주세요", "Choose where to install Beolkkuri"), folder);
        if (chosen == null) return;
        // Picking "D:\Games" installs into "D:\Games\Beolkkuri".
        if (!string.Equals(Path.GetFileName(chosen.TrimEnd('\\')), "Beolkkuri", StringComparison.OrdinalIgnoreCase))
            chosen = Path.Combine(chosen, "Beolkkuri");
        folder = chosen.TrimEnd('\\');
        GoTo(Page.Install);
    }

    void StartInstall()
    {
        busy = true;
        fraction = 0;
        status = "";
        GoTo(Page.Progress);
        bool shortcut = desktop.Checked;
        string target = folder;
        var worker = new Thread(delegate()
        {
            var installer = new Installer(payload);
            bool ok = installer.Run(target, shortcut, Report);
            BeginInvoke((Action)delegate
            {
                busy = false;
                imported = installer.ImportedSettings;
                error = installer.Error;
                GoTo(ok ? Page.Done : Page.Failed);
            });
        });
        worker.IsBackground = true;
        // Shortcuts are made through COM (WScript.Shell).
        worker.SetApartmentState(ApartmentState.STA);
        worker.Start();
    }

    void StartRemove()
    {
        busy = true;
        fraction = 0;
        GoTo(Page.Removing);
        bool all = removeSettings.Checked;
        string target = folder;
        var worker = new Thread(delegate()
        {
            bool ok = Uninstaller.Run(target, all, Report);
            BeginInvoke((Action)delegate
            {
                busy = false;
                removedWithSettings = all || !Uninstaller.HasKeptSettings(target);
                error = L.T("일부 파일을 지우지 못했어요. 벌꿀이를 닫고 다시 시도해 주세요.", "Some files could not be removed. Close Beolkkuri and try again.");
                GoTo(ok ? Page.Removed : Page.Failed);
            });
        });
        worker.IsBackground = true;
        // Shortcuts are made through COM (WScript.Shell).
        worker.SetApartmentState(ApartmentState.STA);
        worker.Start();
    }

    void Report(double value, string text)
    {
        BeginInvoke((Action)delegate { fraction = value; status = text; Invalidate(); });
    }

    void OpenAndClose()
    {
        try
        {
            var start = new ProcessStartInfo(Path.Combine(folder, "Beolkkuri.exe"));
            start.WorkingDirectory = folder;
            start.UseShellExecute = true;
            Process.Start(start);
        }
        catch (Exception e) { Log.Write("Could not open Beolkkuri: " + e.Message); }
        Close();
    }

    // ---- painting ---------------------------------------------------------

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.ScaleTransform(scale, scale);
        Render(e.Graphics);
    }

    void Render(Graphics g)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
        PaintBackground(g);
        PaintHeader(g);
        switch (page)
        {
            case Page.Install: PaintInstall(g); break;
            case Page.Progress:
                PaintTitle(g, L.T("설치하는 중이에요", "Installing"), L.T("잠깐이면 끝나요. 창을 닫지 말고 기다려 주세요.", "This only takes a moment. Please keep this window open."));
                PaintProgress(g);
                break;
            case Page.Done:
                PaintTitle(g, L.T("설치가 끝났어요!", "All set!"), imported
                    ? L.T("시작 메뉴에 벌꿀이를 만들고, 전에 쓰던 설정도 가져왔어요.", "Beolkkuri is in the Start menu, with the settings from your previous install.")
                    : desktop.Checked
                        ? L.T("시작 메뉴와 바탕화면에서 언제든 벌꿀이를 열 수 있어요.", "Open Beolkkuri any time from the Start menu or your desktop.")
                        : L.T("시작 메뉴에서 언제든 벌꿀이를 열 수 있어요.", "Open Beolkkuri any time from the Start menu."));
                PaintTips(g);
                break;
            case Page.Failed:
                PaintTitle(g, uninstall ? L.T("지우지 못했어요", "Couldn't uninstall") : L.T("설치하지 못했어요", "Couldn't install"), error);
                PaintNote(g, L.T("자세한 기록: ", "Details: ") + Log.Path, 300, true);
                break;
            case Page.Remove:
                PaintTitle(g, L.T("벌꿀이를 지울까요?", "Uninstall Beolkkuri?"), folder, true);
                PaintNote(g, L.T("체크하지 않으면 설정은 남겨 둬요. 다시 설치하면 그대로 이어서 쓸 수 있어요.", "Unchecked, your settings stay, so a new install picks up where you left off."), 294);
                break;
            case Page.Removing:
                PaintTitle(g, L.T("지우는 중이에요", "Uninstalling"), folder, true);
                PaintProgress(g);
                break;
            case Page.Removed:
                PaintTitle(g, L.T("벌꿀이를 지웠어요", "Beolkkuri is uninstalled"), removedWithSettings
                    ? L.T("모든 파일을 지웠어요.", "Every file is gone.")
                    : L.T("설정은 남겨 뒀어요. 다시 설치하면 그대로 이어서 쓸 수 있어요.", "Your settings stay, so a new install picks up where you left off."));
                if (!removedWithSettings) PaintNote(g, folder, 248, true);
                break;
        }
        foreach (Widget widget in widgets) widget.Paint(g);
        using (var pen = new Pen(Theme.Ink, 3)) g.DrawRectangle(pen, 1.5f, 1.5f, W - 3, H - 3);
    }

    static void PaintBackground(Graphics g)
    {
        g.Clear(Theme.Honey);
        // The website's honeycomb pattern.
        using (var pen = new Pen(Color.FromArgb(23, Theme.Ink), 2))
        {
            for (float y = 0; y < H; y += 97)
                for (float x = 0; x < W; x += 56)
                {
                    g.DrawPolygon(pen, new[] {
                        new PointF(x + 28, y), new PointF(x + 56, y + 16.2f), new PointF(x + 56, y + 48.5f),
                        new PointF(x + 28, y + 64.7f), new PointF(x, y + 48.5f), new PointF(x, y + 16.2f) });
                    g.DrawLine(pen, x + 28, y + 64.7f, x + 28, y + 97);
                }
        }
        // Honey dripping from the top edge.
        const float band = 20;
        float[][] drips = { new float[] { 96, 16 }, new float[] { 444, 28 }, new float[] { 562, 14 } };
        using (var edge = new GraphicsPath())
        {
            float x = W;
            for (int i = drips.Length - 1; i >= 0; i--)
            {
                float center = drips[i][0], length = drips[i][1], r = 11, f = 7;
                edge.AddLine(x, band, center + r + f, band);
                edge.AddBezier(center + r + f, band, center + r, band, center + r, band, center + r, band + f);
                edge.AddLine(center + r, band + f, center + r, band + length);
                edge.AddArc(center - r, band + length - r, r * 2, r * 2, 0, 180);
                edge.AddLine(center - r, band + length, center - r, band + f);
                edge.AddBezier(center - r, band + f, center - r, band, center - r, band, center - r - f, band);
                x = center - r - f;
            }
            edge.AddLine(x, band, 0, band);
            using (var fill = (GraphicsPath)edge.Clone())
            {
                fill.AddLine(0, band, 0, 0);
                fill.AddLine(0, 0, W, 0);
                fill.CloseFigure();
                using (var brush = new SolidBrush(Theme.Amber)) g.FillPath(brush, fill);
            }
            using (var pen = new Pen(Theme.Ink, 3)) g.DrawPath(pen, edge);
        }
    }

    void PaintHeader(Graphics g)
    {
        if (logo != null) g.DrawImage(logo, new RectangleF(36, 46, 84, 84));
        using (Font title = Theme.Heading(46))
        using (Font small = Theme.Heading(15))
        using (var ink = new SolidBrush(Theme.Ink))
        using (var muted = new SolidBrush(Color.FromArgb(190, Theme.Ink)))
        {
            g.DrawString(L.T("벌꿀이", "Beolkkuri"), title, ink, 128, 50);
            string sub = L.T("BEOLKKURI", "벌꿀이");
            if (payload != null) sub += "  ·  v" + payload.Version;
            g.DrawString(sub, small, muted, 133, 106);
        }
    }

    void PaintTitle(Graphics g, string title, string text, bool isPath = false)
    {
        using (Font heading = Theme.Heading(30))
        using (Font body = isPath ? Theme.Path(15) : Theme.Text(15, false))
        using (var ink = new SolidBrush(Theme.Ink))
        {
            g.DrawString(title, heading, ink, 38, 168);
            g.DrawString(text ?? "", body, ink, new RectangleF(40, 214, W - 80, 66));
        }
    }

    void PaintNote(Graphics g, string text, float y, bool isPath = false)
    {
        using (Font font = isPath ? Theme.Path(12.5f) : Theme.Text(12.5f, false))
        using (var brush = new SolidBrush(Theme.Muted))
            g.DrawString(text, font, brush, new RectangleF(40, y, W - 80, 36));
    }

    void PaintInstall(Graphics g)
    {
        // A sticker like the website's .tag, tilted.
        string tag = Upgrading ? L.T("새 버전으로 바꿔요 · 내 설정은 그대로 남아요", "Updates in place · your settings stay")
                               : L.T("꿀 파밍은 벌꿀이한테 맡겨요", "Leave the honey farming to Beolkkuri");
        using (Font font = Theme.Heading(17))
        {
            SizeF size = g.MeasureString(tag, font);
            GraphicsState state = g.Save();
            g.TranslateTransform(40, 150);
            g.RotateTransform(-2.5f);
            Theme.Card(g, new RectangleF(0, 0, size.Width + 22, 34), 10, Theme.Red, 3, Theme.Ink, 2.5f);
            using (var white = new SolidBrush(Color.White)) g.DrawString(tag, font, white, 11, 8);
            g.Restore(state);
        }

        Theme.Card(g, new RectangleF(40, 210, 560, 136), 18, Theme.Paper, 5, Theme.Ink, 3);
        using (Font label = Theme.Text(13, true))
        using (Font path = Theme.Path(14))
        using (var muted = new SolidBrush(Theme.Muted))
        using (var ink = new SolidBrush(Theme.Ink))
        using (var format = new StringFormat { LineAlignment = StringAlignment.Center, Trimming = StringTrimming.EllipsisPath, FormatFlags = StringFormatFlags.NoWrap })
        {
            g.DrawString(L.T("설치할 곳", "Install to"), label, muted, 62, 226);
            var box = new RectangleF(62, 252, 428, 38);
            Theme.Card(g, box, 10, Color.White, 0, Theme.Ink, 2.5f);
            g.DrawString(folder, path, ink, new RectangleF(box.X + 12, box.Y, box.Width - 24, box.Height), format);
        }
        if (payload != null)
        {
            using (Font font = Theme.Text(12.5f, false))
            using (var brush = new SolidBrush(Theme.Ink))
                g.DrawString(string.Format(L.T("{0} 정도 필요해요\n관리자 권한 없이 내 계정에만 설치돼요", "Needs about {0}\nInstalls for your account only, no admin needed"),
                                           FormatSize(payload.InstalledBytes)), font, brush, new RectangleF(256, 366, 344, 44));
        }
        PaintNote(g, L.T("비공식 팬 프로그램이에요. Onett, Roblox와 관련이 없어요.", "Unofficial fan-made tool, not affiliated with Onett or Roblox."), 424);
    }

    void PaintProgress(Graphics g)
    {
        var track = new RectangleF(40, 282, 560, 34);
        Theme.Card(g, track, 17, Theme.Paper, 4, Theme.Ink, 3);
        float width = (float)(track.Width * Math.Max(0, Math.Min(1, fraction)));
        if (width > 6)
        {
            var fill = new RectangleF(track.X, track.Y, Math.Max(width, 34), track.Height);
            using (GraphicsPath clip = Theme.Rounded(fill, 17))
            {
                GraphicsState state = g.Save();
                g.SetClip(clip);
                using (var brush = new SolidBrush(Theme.Honey)) g.FillRectangle(brush, fill);
                // Moving stripes, like honey being poured in.
                using (var stripe = new SolidBrush(Theme.Amber))
                {
                    float shift = frame * 1.2f % 28;
                    for (float x = fill.X - 40 + shift; x < fill.Right; x += 28)
                        g.FillPolygon(stripe, new[] { new PointF(x, fill.Bottom), new PointF(x + 12, fill.Bottom), new PointF(x + 12 + 34, fill.Y), new PointF(x + 34, fill.Y) });
                }
                g.Restore(state);
                using (var pen = new Pen(Theme.Ink, 3)) g.DrawPath(pen, clip);
            }
        }
        // The mascot rides along the end of the bar.
        if (bee != null)
        {
            float bob = animate ? (float)Math.Sin(frame / 5.0) * 3 : 0;
            float x = Math.Max(track.X - 6, Math.Min(track.X + width - 30, track.Right - 52));
            g.DrawImage(bee, new RectangleF(x, track.Y - 46 + bob, 58, 58));
        }
        using (Font font = Theme.Text(14, false))
        using (Font percent = Theme.Heading(20))
        using (var ink = new SolidBrush(Theme.Ink))
        using (var right = new StringFormat { Alignment = StringAlignment.Far })
        {
            g.DrawString(status, font, ink, 40, 330);
            g.DrawString(((int)Math.Round(fraction * 100)) + "%", percent, ink, new RectangleF(400, 328, 200, 30), right);
        }
    }

    void PaintTips(Graphics g)
    {
        Theme.Card(g, new RectangleF(40, 256, 560, 82), 18, Theme.Paper, 5, Theme.Ink, 3);
        string[] tips = {
            L.T("로블록스에서 비 스웜 시뮬레이터에 들어가요", "Join Bee Swarm Simulator in Roblox"),
            L.T("벌꿀이를 열고 시작을 눌러요 · 디스플레이 배율은 100%를 추천해요", "Open Beolkkuri and press Start · display scale 100% works best"),
        };
        using (Font number = Theme.Heading(15))
        using (Font font = Theme.Text(14, false))
        using (var ink = new SolidBrush(Theme.Ink))
        using (var honey = new SolidBrush(Theme.Honey))
        using (var center = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center })
        {
            for (int i = 0; i < tips.Length; i++)
            {
                float y = 270 + i * 30;
                var dot = new RectangleF(60, y, 24, 24);
                using (GraphicsPath circle = Theme.Rounded(dot, 12)) g.FillPath(ink, circle);
                g.DrawString((i + 1).ToString(), number, honey, new RectangleF(dot.X, dot.Y + 1, dot.Width, dot.Height), center);
                g.DrawString(tips[i], font, ink, 94, y + 2);
            }
        }
    }

    public static string FormatSize(long bytes)
    {
        return bytes >= (1L << 30) ? (bytes / (double)(1L << 30)).ToString("0.0") + " GB" : (bytes >> 20) + " MB";
    }

    // ---- input ------------------------------------------------------------

    PointF Logical(Point p) { return new PointF(p.X / scale, p.Y / scale); }

    Widget At(PointF p)
    {
        for (int i = widgets.Count - 1; i >= 0; i--)
            if (widgets[i].Bounds.Contains(p)) return widgets[i];
        return null;
    }

    protected override void OnMouseMove(MouseEventArgs e)
    {
        Widget hit = At(Logical(e.Location));
        bool changed = false;
        foreach (Widget widget in widgets)
        {
            bool hover = widget == hit && (pressed == null || pressed == widget);
            if (widget.Hover != hover) { widget.Hover = hover; changed = true; }
            bool down = widget == pressed && widget == hit;
            if (widget.Pressed != down) { widget.Pressed = down; changed = true; }
        }
        Cursor = hit != null ? Cursors.Hand : Cursors.Default;
        if (changed) Invalidate();
    }

    protected override void OnMouseLeave(EventArgs e)
    {
        foreach (Widget widget in widgets) widget.Hover = widget.Pressed = false;
        Invalidate();
    }

    protected override void OnMouseDown(MouseEventArgs e)
    {
        if (e.Button != MouseButtons.Left) return;
        pressed = At(Logical(e.Location));
        if (pressed != null) { pressed.Pressed = true; Invalidate(); }
    }

    protected override void OnMouseUp(MouseEventArgs e)
    {
        Widget released = pressed;
        pressed = null;
        if (released == null) return;
        released.Pressed = false;
        Invalidate();
        if (released == At(Logical(e.Location)) && released.Click != null && widgets.Contains(released)) released.Click();
    }

    protected override void OnKeyDown(KeyEventArgs e)
    {
        if (e.KeyCode == Keys.Enter && primary != null) primary.Click();
        else if (e.KeyCode == Keys.Escape && widgets.Contains(close)) Close();
    }

    // Drag the window by the top part, like a title bar.
    protected override void WndProc(ref Message m)
    {
        const int WM_NCHITTEST = 0x84, HTCLIENT = 1, HTCAPTION = 2;
        base.WndProc(ref m);
        if (m.Msg == WM_NCHITTEST && (int)m.Result == HTCLIENT)
        {
            long value = m.LParam.ToInt64();
            Point screen = new Point((short)(value & 0xffff), (short)((value >> 16) & 0xffff));
            PointF p = Logical(PointToClient(screen));
            if (p.Y < 140 && At(p) == null) m.Result = (IntPtr)HTCAPTION;
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Stopping halfway would leave a broken install.
        if (busy) e.Cancel = true;
        base.OnFormClosing(e);
    }

    // ---- screenshots (/shot=folder) ----------------------------------------

    public static void SaveShots(string outFolder, Payload payload)
    {
        Directory.CreateDirectory(outFolder);
        string prefix = L.Korean ? "ko" : "en";
        // A sample path, so published screenshots don't show this PC's user name.
        var form = new SetupForm(payload, @"C:\Users\me\AppData\Local\Programs\Beolkkuri", false);
        form.Shot(Page.Install, Path.Combine(outFolder, prefix + "-install.png"));
        form.fraction = 0.62;
        form.frame = 9;
        form.status = L.T("파일을 복사하는 중", "Copying files");
        form.Shot(Page.Progress, Path.Combine(outFolder, prefix + "-progress.png"));
        form.Shot(Page.Done, Path.Combine(outFolder, prefix + "-done.png"));
        form.error = L.T("이 폴더에는 설치할 수 없어요. 다른 폴더를 골라 주세요.", "Can't install into this folder. Please choose another one.");
        form.Shot(Page.Failed, Path.Combine(outFolder, prefix + "-failed.png"));
        var remove = new SetupForm(null, form.folder, true);
        remove.Shot(Page.Remove, Path.Combine(outFolder, prefix + "-uninstall.png"));
        remove.Shot(Page.Removed, Path.Combine(outFolder, prefix + "-uninstalled.png"));
    }

    void Shot(Page target, string file)
    {
        GoTo(target);
        timer.Stop();
        const float shotScale = 2;
        using (var bitmap = new Bitmap((int)(W * shotScale), (int)(H * shotScale)))
        {
            using (Graphics g = Graphics.FromImage(bitmap))
            {
                g.ScaleTransform(shotScale, shotScale);
                Render(g);
            }
            bitmap.Save(file, ImageFormat.Png);
        }
    }
}

// The Explorer-style folder picker (IFileOpenDialog), or the old tree dialog if it is unavailable.
static class FolderPicker
{
    public static string Pick(IntPtr owner, string title, string start)
    {
        try
        {
            var dialog = (IFileDialog)new FileOpenDialogCoClass();
            uint options;
            dialog.GetOptions(out options);
            dialog.SetOptions(options | 0x20 | 0x40 | 0x800); // FOS_PICKFOLDERS | FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST
            dialog.SetTitle(title);
            string existing = start;
            while (existing != null && !Directory.Exists(existing)) existing = Path.GetDirectoryName(existing);
            if (existing != null)
            {
                IShellItem item;
                Guid shellItem = typeof(IShellItem).GUID;
                if (SHCreateItemFromParsingName(existing, IntPtr.Zero, ref shellItem, out item) == 0) dialog.SetFolder(item);
            }
            if (dialog.Show(owner) != 0) return null;
            IShellItem result;
            dialog.GetResult(out result);
            string path;
            result.GetDisplayName(0x80058000, out path); // SIGDN_FILESYSPATH
            return path;
        }
        catch (Exception e)
        {
            Log.Write("Folder picker fallback: " + e.Message);
            using (var dialog = new FolderBrowserDialog { Description = title, SelectedPath = start })
                return dialog.ShowDialog() == DialogResult.OK ? dialog.SelectedPath : null;
        }
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    static extern int SHCreateItemFromParsingName(string path, IntPtr bindContext, ref Guid riid, out IShellItem item);

    [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")]
    class FileOpenDialogCoClass { }

    [ComImport, Guid("42f85136-db7e-439c-85f1-e4075d135fc8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IFileDialog
    {
        [PreserveSig] int Show(IntPtr parent);
        void SetFileTypes(uint count, IntPtr filters);
        void SetFileTypeIndex(uint index);
        void GetFileTypeIndex(out uint index);
        void Advise(IntPtr events, out uint cookie);
        void Unadvise(uint cookie);
        void SetOptions(uint options);
        void GetOptions(out uint options);
        void SetDefaultFolder(IShellItem item);
        void SetFolder(IShellItem item);
        void GetFolder(out IShellItem item);
        void GetCurrentSelection(out IShellItem item);
        void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name);
        void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string name);
        void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
        void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string text);
        void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string label);
        void GetResult(out IShellItem item);
        void AddPlace(IShellItem item, int place);
        void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string extension);
        void Close(int result);
        void SetClientGuid(ref Guid guid);
        void ClearClientData();
        void SetFilter(IntPtr filter);
    }

    [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IShellItem
    {
        void BindToHandler(IntPtr bindContext, ref Guid handler, ref Guid riid, out IntPtr result);
        void GetParent(out IShellItem parent);
        void GetDisplayName(uint form, [MarshalAs(UnmanagedType.LPWStr)] out string name);
        void GetAttributes(uint mask, out uint attributes);
        void Compare(IShellItem other, uint hint, out int order);
    }
}
