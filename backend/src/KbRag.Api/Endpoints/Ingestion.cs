using FluentValidation;
using KbRag.Core.Ingestion.FileValidation;

namespace KbRag.Api.Endpoints;

public static class Ingestion
{
    public static void MapIngestionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ingestion")
            .WithTags("Ingestion");
        
        group.MapPost("/upload", UploadFile);
        group.MapPost("/process", TriggerIngestion);
        group.MapGet("/status/{jobId}", StreamIngestionStatus);
        group.MapGet("/files/{fileId}/chunks", GetFileChunksVisuals);
    }
    
    static async Task<IResult> UploadFile(
        IFormFile? file, 
        IValidator<FileUploadRequest> validator)
    {
        var request = new FileUploadRequest(
            file?.FileName,
            file?.ContentType,
            file?.Length ?? 0);

        var validationResult = await validator.ValidateAsync(request);
        
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(
                validationResult.ToDictionary());
        }

        var fileType = FileUploadValidator.GetFileType(file!.FileName);
        
        // TODO: Implement file storage and return actual job ID
        var jobId = Guid.NewGuid();
        return Results.Ok(new { JobId = jobId, FileType = fileType });
    }

    static Task<IResult> TriggerIngestion()
    {
        // TODO: Implement ingestion trigger
        throw new NotImplementedException();
    }

    static Task<IResult> StreamIngestionStatus(string jobId)
    {
        // TODO: Implement status streaming
        throw new NotImplementedException();
    }

    static Task<IResult> GetFileChunksVisuals(string fileId)
    {
        // TODO: Implement chunk visualization
        throw new NotImplementedException();
    }
}