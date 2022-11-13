<# :
@echo off & setlocal & set __args=%* & %SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command Invoke-Expression ('. { ' + (Get-Content -LiteralPath ""%~f0"" -Raw) + ' }' + $env:__args) & exit /b %ERRORLEVEL%
#> Add-Type @'
// ========== BEGIN C# CODE ==========
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Threading;

public class App
{
	public static void Run(string[] args)
	{
		// Read latest versions from change log
		string version = GetVersion(@"doc\changes.html");
		string versionYear = GetVersionYear(@"doc\changes.html");
		Console.WriteLine("Version " + version + ", Copyright " + versionYear);

		// Write version to source and documentation files
		Console.WriteLine("Updating version and year in all files...");
		bool modified = false;
		// Code
		modified |= UpdateFile(@"src\js\arraylist.js", @"(ArrayList\.version = "")[^""]*("";)", "${1}" + version + "$2");
		// File license headers
		string headerPattern = @"(/\*!\s*[0-9a-z-]+.(?:scss|js)\s+v)\S*";
		string headerReplacement = "${1}" + version;
		modified |= UpdateFile(@"src\css\frontfire-ui-complete.scss", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\css\frontfire-ui-minimal.scss", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\arraylist.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\color.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\datacolor.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-core.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-core-singlefile.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-ui-complete.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-ui-complete-singlefile.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-ui-minimal.js", headerPattern, headerReplacement);
		modified |= UpdateFile(@"src\js\frontfire-ui-minimal-singlefile.js", headerPattern, headerReplacement);
		// Documentation
		string versionPattern = @"(<span\s+id=""version-id"">).*?(</span>)";
		string versionReplacement = "${1}" + version + "$2";
		modified |= UpdateFile(@"doc\*.html", versionPattern, versionReplacement);

		// Write copyright year to source and documentation files
		// File license headers
		modified |= UpdateFileYear(@"src\css\frontfire-ui-complete.scss", versionYear);
		modified |= UpdateFileYear(@"src\css\frontfire-ui-minimal.scss", versionYear);
		modified |= UpdateFileYear(@"src\js\arraylist.js", versionYear);
		modified |= UpdateFileYear(@"src\js\color.js", versionYear);
		modified |= UpdateFileYear(@"src\js\datacolor.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-core.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-core-singlefile.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-ui-complete.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-ui-complete-singlefile.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-ui-minimal.js", versionYear);
		modified |= UpdateFileYear(@"src\js\frontfire-ui-minimal-singlefile.js", versionYear);
		// Documentation
		modified |= UpdateFileYear(@"doc\*.html", versionYear);

		if (modified)
		{
			Console.WriteLine();
			Console.WriteLine("NOTE: Files have been modified.");
			Console.WriteLine("Please wait until the build files are updated,");
			Console.WriteLine("then press Enter to continue.");
			Console.ReadLine();
		}
		else
		{
			Console.WriteLine("All files up-to-date.");
		}

		// Remove all previous dist files
		Console.WriteLine("Creating distribution archive...");
		if (Directory.Exists("dist"))
			Directory.Delete("dist", true);
		Directory.CreateDirectory("dist");
		Directory.SetCurrentDirectory("dist");

		// Create new archive's directories and collect all files
		string dir = "js";
		Copy(@"..\src\js\arraylist.js", dir);
		Copy(@"..\src\js\color.js", dir);
		Copy(@"..\src\js\datacolor.js", dir);
		Copy(@"..\src\js\frontfire-core.js", dir);
		Copy(@"..\src\js\build\frontfire-ui-minimal.bundle.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-complete.bundle.js*", dir);
		dir = "js-min";
		Copy(@"..\src\js\build\arraylist.min.js*", dir);
		Copy(@"..\src\js\build\color.min.js*", dir);
		Copy(@"..\src\js\build\datacolor.min.js*", dir);
		Copy(@"..\src\js\build\frontfire-core.min.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-minimal.min.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-complete.min.js*", dir);
		dir = "js-singlefile";
		Copy(@"..\src\js\build\frontfire-core-singlefile.bundle.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-minimal-singlefile.bundle.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-complete-singlefile.bundle.js*", dir);
		dir = "js-singlefile-min";
		Copy(@"..\src\js\build\frontfire-core-singlefile.min.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-minimal-singlefile.min.js*", dir);
		Copy(@"..\src\js\build\frontfire-ui-complete-singlefile.min.js*", dir);
		dir = "css";
		Copy(@"..\src\css\build\frontfire-ui-minimal.css*", dir);
		Copy(@"..\src\css\build\frontfire-ui-complete.css*", dir);
		dir = "css-min";
		Copy(@"..\src\css\build\frontfire-ui-minimal.min.css*", dir);
		Copy(@"..\src\css\build\frontfire-ui-complete.min.css*", dir);
		dir = "doc";
		Copy(@"..\doc\*.html", dir);
		Copy(@"..\license.txt", dir);
		File.WriteAllText(@"doc\version.txt", version);
		dir = @"doc\res";
		Copy(@"..\doc\res\*", dir);
		Copy(@"..\logo\frontfire.svg", dir);
		dir = "";
		Copy(@"..\readme.md", dir);

		// Adjust include paths in doc files
		UpdateFile(@"doc\*.html", @"\.\./src/css/build", "../css-min", true);
		UpdateFile(@"doc\*.html", @"\.\./logo", "res", true);
		UpdateFile(@"doc\*.html", @"\.\./src/js/build", "../js-singlefile-min", true);
		UpdateFile(@".\readme.md", @"src=""logo/", @"src=""doc/res/", true);
		UpdateFile(@".\readme.md", @"\(license\.txt\)", "(doc/license.txt)", true);

		// Create the archive
		Exec("7za", "a frontfire_" + version + ".zip js js-min js-singlefile js-singlefile-min css css-min doc readme.md");
		Exec("7za", "a frontfire_" + version + ".7z js js-min js-singlefile js-singlefile-min css css-min doc readme.md");

		// Delete the uncompressed files, leaving only the archive in the dist directory
		Directory.Delete("js", true);
		Directory.Delete("js-min", true);
		Directory.Delete("js-singlefile", true);
		Directory.Delete("js-singlefile-min", true);
		Directory.Delete("css", true);
		Directory.Delete("css-min", true);
		Directory.Delete("doc", true);
		File.Delete("readme.md");
		Directory.SetCurrentDirectory("..");

		// Update minified compressed file sizes in readme file
		Console.WriteLine("Updating minified compressed file sizes in readme...");
		modified = false;
		modified |= UpdateFileSize(@"src\css\build\frontfire-ui-minimal.min.css");
		modified |= UpdateFileSize(@"src\css\build\frontfire-ui-complete.min.css");
		modified |= UpdateFileSize(@"src\js\build\arraylist.min.js");
		modified |= UpdateFileSize(@"src\js\build\color.min.js");
		modified |= UpdateFileSize(@"src\js\build\datacolor.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-core.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-core-singlefile.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-ui-minimal.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-ui-minimal-singlefile.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-ui-complete.min.js");
		modified |= UpdateFileSize(@"src\js\build\frontfire-ui-complete-singlefile.min.js");
		if (modified)
		{
			Console.WriteLine("Readme file has been modified.");
		}
		else
		{
			Console.WriteLine("Readme file already up-to-date.");
		}

		// Exit
		Console.WriteLine("Finished.");
		Thread.Sleep(2000);
		// Process return codes are not supported by PowerShell with this method.
	}

	private static string GetVersion(string changesFile)
	{
		foreach (string line in File.ReadLines(changesFile))
		{
			var match = Regex.Match(line, @"^\s*<h2\s+id="".*?"">\s*Version\s+(\S+)\s*</h2>");
			if (match.Success)
			{
				return match.Groups[1].Value;
			}
		}
		throw new Exception("Version could not be determined.");
	}

	private static string GetVersionYear(string changesFile)
	{
		foreach (string line in File.ReadLines(changesFile))
		{
			var match = Regex.Match(line, @"^\s*<p>\s*Released:\s+([0-9]{4})-[0-9]{2}-[0-9]{2}\s*</p>");
			if (match.Success)
			{
				return match.Groups[1].Value;
			}
		}
		throw new Exception("Version year could not be determined.");
	}

	private static bool UpdateFile(string fileNames, string pattern, string replacement, bool replaceAll = false)
	{
		string dir = Path.GetDirectoryName(fileNames);
		string name = Path.GetFileName(fileNames);
		bool anyModified = false;
		foreach (string fileName in Directory.GetFiles(dir, name))
		{
			bool modified = false;
			string[] lines = File.ReadAllLines(fileName);
			for (int i = 0; i < lines.Length; i++)
			{
				if (Regex.IsMatch(lines[i], pattern))
				{
					string newLine = Regex.Replace(lines[i], pattern, replacement);
					if (newLine != lines[i])
					{
						lines[i] = newLine;
						modified = true;
					}
					if (!replaceAll)
						break;
				}
			}
			if (modified)
				File.WriteAllLines(fileName, lines);
			anyModified |= modified;
		}
		return anyModified;
	}

	private static bool UpdateFileYear(string fileNames, string year)
	{
		string dir = Path.GetDirectoryName(fileNames);
		string name = Path.GetFileName(fileNames);
		bool anyModified = false;
		foreach (string fileName in Directory.GetFiles(dir, name))
		{
			bool modified = false;
			string[] lines = File.ReadAllLines(fileName);
			for (int i = 0; i < lines.Length; i++)
			{
				// U+00A9: COPYRIGHT SIGN
				// U+2013: EN DASH
				var match = Regex.Match(lines[i], @"Copyright\s+(\u00a9|\(c\))\s+([0-9]{4})([-\u2013][0-9]{4})?");
				if (match.Success)
				{
					string newLine = lines[i];
					if (match.Groups[3].Success)
					{
						// Year range specified, only update range end
						newLine = Regex.Replace(lines[i], @"(Copyright\s+(?:\u00a9|\(c\))\s+[0-9]{4}[-\u2013])[0-9]{4}", "${1}" + year);
					}
					else if (match.Groups[2].Value != year)
					{
						// Single year specified, extend range from there
						string sep = "-";
						if (match.Groups[1].Value == "\u00A9")
							sep = "\u2013";
						newLine = Regex.Replace(lines[i], @"(Copyright\s+(?:\u00a9|\(c\))\s+[0-9]{4})", "${1}" + sep + year);
					}
					if (newLine != lines[i])
					{
						lines[i] = newLine;
						modified = true;
					}
					break;
				}
			}
			if (modified)
				File.WriteAllLines(fileName, lines);
			anyModified |= modified;
		}
		return anyModified;
	}

	private static bool UpdateFileSize(string filePath)
	{
		string fileName = Path.GetFileName(filePath);
		string pattern = @"(?<=\W" + Regex.Escape(fileName) + @"\s*)\([0-9.]+\s*KiB\)";

		double sizeKiB = (double)GetCompressedSize(filePath) / 1024;
		string sizeStr = sizeKiB.ToString("0", CultureInfo.InvariantCulture);
		if (sizeKiB < 10)
			sizeStr = sizeKiB.ToString("0.0", CultureInfo.InvariantCulture);

		bool modified = false;
		string[] lines = File.ReadAllLines("readme.md");
		for (int i = 0; i < lines.Length; i++)
		{
			if (Regex.IsMatch(lines[i], pattern))
			{
				string newLine = Regex.Replace(lines[i], pattern, "(" + sizeStr + "\xA0KiB)");
				if (newLine != lines[i])
				{
					lines[i] = newLine;
					modified = true;
				}
				break;
			}
		}
		if (modified)
			File.WriteAllLines("readme.md", lines);
		return modified;
	}

	private static long GetCompressedSize(string fileName)
	{
		try
		{
			using (var ms = new MemoryStream())
			{
				using (var fs = File.OpenRead(fileName))
				using (var gs = new GZipStream(ms, CompressionMode.Compress, leaveOpen: true))
				{
					fs.CopyTo(gs);
				}
				return ms.Length;
			}
		}
		catch (IOException)
		{
			return -1;
		}
	}

	private static void Copy(string source, string destDir)
	{
		if (destDir != "")
			Directory.CreateDirectory(destDir);
		string sourceDir = Path.GetDirectoryName(source);
		string sourceFiles = Path.GetFileName(source);
		foreach (string file in Directory.GetFiles(sourceDir, sourceFiles))
		{
			File.Copy(file, Path.Combine(destDir, Path.GetFileName(file)));
		}
	}

	private static void Exec(string fileName, string args)
	{
		var process = Process.Start(new ProcessStartInfo
		{
			FileName = fileName,
			Arguments = args,
			CreateNoWindow = true,
			UseShellExecute = false
		});
		process.WaitForExit();
		if (process.ExitCode != 0)
			throw new Exception("Process " + fileName + " exited with error code " + process.ExitCode + ".");
	}
}
// ========== END C# CODE ==========
'@; [App]::Run($args)
