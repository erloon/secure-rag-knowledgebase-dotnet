using Qdrant.Client;

var builder = WebApplication.CreateBuilder(args);


builder.AddServiceDefaults();

builder.AddQdrantClient("qdrant");
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins("http://localhost:3010")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});


var app = builder.Build();
app.UseCors();
app.MapDefaultEndpoints();
app.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow,
    Service = "KbRag.Api"
}));
app.Run();
