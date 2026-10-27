// Beolkkuri.exe: starts the macro with the Python that Beolkkuri-Setup.exe put in
// runtime\ next to this file, and starts it again when an in-app update asks for it.
// Built by scripts/windows/build_installer.ps1 with the C# 5 compiler in .NET Framework 4.
using System;
using System.Diagnostics;
using System.IO;
using System.Text;

static class Launcher
{
    // src/modules/misc/update.py RESTART_EXIT_CODE: the update is in place, start the new version.
    const int RestartExitCode = 75;
    // Ctrl+C or closing the console window; not an error.
    const int ControlCExitCode = unchecked((int)0xC000013A);

    static int Main()
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        Console.Title = "벌꿀이 (Beolkkuri)";
        // Ctrl+C reaches the macro too; let it stop by itself and report how it ended.
        Console.CancelKeyPress += delegate(object sender, ConsoleCancelEventArgs e) { e.Cancel = true; };

        string root = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
        string python = Path.Combine(root, @"runtime\python.exe");
        string src = Path.Combine(root, "src");
        if (!File.Exists(python) || !File.Exists(Path.Combine(src, "main.py")))
        {
            Fail("벌꿀이 파일이 일부 없어요. Beolkkuri-Setup.exe로 다시 설치해 주세요.",
                 "Some Beolkkuri files are missing. Please reinstall with Beolkkuri-Setup.exe.");
            return 1;
        }

        StopRunningCopies(root, python);

        Say(ConsoleColor.Green, "벌꿀이 실행 중... 이 창은 매크로가 켜져 있는 동안 열어 두세요.");
        Say(ConsoleColor.Green, "Starting Beolkkuri. Keep this window open while the macro runs.");
        while (true)
        {
            int code = Run(python, src);
            if (code == RestartExitCode)
            {
                Console.WriteLine();
                Say(ConsoleColor.Green, "업데이트를 마쳤어요. 벌꿀이를 다시 켜요...");
                Say(ConsoleColor.Green, "Update installed. Restarting Beolkkuri...");
                continue;
            }
            if (code != 0 && code != ControlCExitCode)
            {
                Fail(string.Format("벌꿀이가 오류로 멈췄어요 (코드 {0}). 위 내용을 GitHub Issues에 올려 주세요.", code),
                     string.Format("Beolkkuri stopped with an error (code {0}). Please report the text above on GitHub Issues.", code));
            }
            return code;
        }
    }

    static int Run(string python, string src)
    {
        var start = new ProcessStartInfo(python, "main.py");
        start.WorkingDirectory = src;
        start.UseShellExecute = false;
        // Read and write files as UTF-8 regardless of the Windows language (Korean Windows defaults to CP949).
        start.EnvironmentVariables["PYTHONUTF8"] = "1";
        // Packages come from runtime\ only, not from another Python on the PC.
        start.EnvironmentVariables["PYTHONNOUSERSITE"] = "1";
        start.EnvironmentVariables.Remove("PYTHONHOME");
        start.EnvironmentVariables.Remove("PYTHONPATH");
        // The macro exits with RestartExitCode after an update only when a launcher restarts it.
        start.EnvironmentVariables["BEOLKKURI_LAUNCHER"] = "1";
        using (Process process = Process.Start(start))
        {
            process.WaitForExit();
            return process.ExitCode;
        }
    }

    // One Beolkkuri at a time: end an older window of this install and the Python
    // processes it started (the macro and its helper processes).
    static void StopRunningCopies(string root, string python)
    {
        int self = Process.GetCurrentProcess().Id;
        string launcher = Path.Combine(root, "Beolkkuri.exe");
        StopProcesses(Path.GetFileNameWithoutExtension(launcher), launcher, self);
        StopProcesses("python", python, self);
    }

    static void StopProcesses(string name, string path, int self)
    {
        foreach (Process process in Process.GetProcessesByName(name))
        {
            try
            {
                if (process.Id == self) continue;
                if (!string.Equals(process.MainModule.FileName, path, StringComparison.OrdinalIgnoreCase)) continue;
                Console.WriteLine("Stopping existing Beolkkuri process: {0}", process.Id);
                process.Kill();
                process.WaitForExit(3000);
            }
            catch (Exception)
            {
                // Exited meanwhile, or belongs to another user.
            }
            finally
            {
                process.Dispose();
            }
        }
    }

    static void Say(ConsoleColor color, string text)
    {
        Console.ForegroundColor = color;
        Console.WriteLine(text);
        Console.ResetColor();
    }

    // Keep the message on screen; the window would otherwise close at once.
    static void Fail(string korean, string english)
    {
        Console.WriteLine();
        Say(ConsoleColor.Red, korean);
        Say(ConsoleColor.Red, english);
        Console.Write("엔터를 누르면 창이 닫혀요 / Press Enter to close");
        Console.ReadLine();
    }
}
