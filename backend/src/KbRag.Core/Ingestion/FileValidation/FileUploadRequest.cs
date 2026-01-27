namespace KbRag.Core.Ingestion.FileValidation;

/// <summary>
/// Represents a file upload request for validation.
/// </summary>
public sealed record FileUploadRequest(
    string? FileName,
    string? ContentType,
    long FileSize);
