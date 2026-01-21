using Qdrant.Client;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults from Aspire
builder.AddServiceDefaults();

// Add Qdrant client with connection name matching the AppHost resource name
// The connection string and settings are automatically injected by Aspire
builder.AddQdrantClient("qdrant");

var app = builder.Build();

// Map health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow,
    Service = "KbRag.Api"
}));

app.Run();
