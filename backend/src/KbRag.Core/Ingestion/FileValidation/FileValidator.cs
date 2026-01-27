using FluentValidation;

namespace KbRag.Core.Ingestion.FileValidation;

/// <summary>
/// Validates uploaded files against supported formats: PDF, DOCX, Markdown, TXT.
/// </summary>
public sealed class FileUploadValidator : AbstractValidator<FileUploadRequest>
{
    private static readonly Dictionary<string, SupportedFileType> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".pdf", SupportedFileType.Pdf },
        { ".docx", SupportedFileType.Docx },
        { ".md", SupportedFileType.Markdown },
        { ".markdown", SupportedFileType.Markdown },
        { ".txt", SupportedFileType.Txt }
    };

    private static readonly Dictionary<string, SupportedFileType> SupportedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { "application/pdf", SupportedFileType.Pdf },
        { "application/vnd.openxmlformats-officedocument.wordprocessingml.document", SupportedFileType.Docx },
        { "text/markdown", SupportedFileType.Markdown },
        { "text/x-markdown", SupportedFileType.Markdown },
        { "text/plain", SupportedFileType.Txt }
    };

    public FileUploadValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("File name is required.")
            .WithErrorCode("FILE_REQUIRED");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithMessage("File cannot be empty.")
            .WithErrorCode("FILE_EMPTY");

        RuleFor(x => x.FileName)
            .Must(HaveExtension)
            .When(x => !string.IsNullOrEmpty(x.FileName))
            .WithMessage("File must have an extension.")
            .WithErrorCode("FILE_EXTENSION_MISSING");

        RuleFor(x => x.FileName)
            .Must(HaveSupportedExtension)
            .When(x => !string.IsNullOrEmpty(x.FileName) && HaveExtension(x.FileName))
            .WithMessage(x => $"Unsupported file type '{Path.GetExtension(x.FileName)}'. Supported formats: PDF, DOCX, Markdown (.md), TXT.")
            .WithErrorCode("UNSUPPORTED_FILE_TYPE");

        RuleFor(x => x)
            .Must(HaveMatchingContentType)
            .When(x => !string.IsNullOrEmpty(x.FileName) && 
                       !string.IsNullOrEmpty(x.ContentType) && 
                       HaveSupportedExtension(x.FileName))
            .WithMessage(x => $"File extension '{Path.GetExtension(x.FileName)}' does not match content type '{x.ContentType}'.")
            .WithErrorCode("CONTENT_TYPE_MISMATCH")
            .WithName("file");
    }

    private static bool HaveExtension(string? fileName) =>
        !string.IsNullOrEmpty(Path.GetExtension(fileName));

    private static bool HaveSupportedExtension(string? fileName)
    {
        if (string.IsNullOrEmpty(fileName)) return false;
        var extension = Path.GetExtension(fileName);
        return SupportedExtensions.ContainsKey(extension);
    }

    private static bool HaveMatchingContentType(FileUploadRequest request)
    {
        if (string.IsNullOrEmpty(request.FileName) || string.IsNullOrEmpty(request.ContentType))
            return true;

        var extension = Path.GetExtension(request.FileName);
        if (!SupportedExtensions.TryGetValue(extension, out var fileTypeByExtension))
            return true;

        if (!SupportedContentTypes.TryGetValue(request.ContentType, out var fileTypeByContentType))
            return true; // Unknown content type, don't fail on this

        return fileTypeByExtension == fileTypeByContentType;
    }

    /// <summary>
    /// Gets the detected file type from a valid file name.
    /// </summary>
    public static SupportedFileType? GetFileType(string? fileName)
    {
        if (string.IsNullOrEmpty(fileName)) return null;
        var extension = Path.GetExtension(fileName);
        return SupportedExtensions.TryGetValue(extension, out var fileType) ? fileType : null;
    }

    /// <summary>
    /// Gets the list of supported file extensions.
    /// </summary>
    public static IReadOnlyCollection<string> GetSupportedExtensions() => SupportedExtensions.Keys;

    /// <summary>
    /// Gets the list of supported content types.
    /// </summary>
    public static IReadOnlyCollection<string> GetSupportedContentTypes() => SupportedContentTypes.Keys;
}
