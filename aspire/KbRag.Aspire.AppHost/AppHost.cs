using Projects;

var builder = DistributedApplication.CreateBuilder(args);

// Add Qdrant vector database container with persistent lifetime
// Using persistent lifetime avoids waiting for container startup on each run
// Using data volume to persist vector embeddings across container restarts
var qdrant = builder.AddQdrant("qdrant")
                    .WithDataVolume()
                    .WithLifetime(ContainerLifetime.Persistent);

// Add the API project with reference to Qdrant
// The WaitFor ensures the API starts only after Qdrant is ready
builder.AddProject<KbRag_Api>("kbrag-api")
       .WithReference(qdrant)
       .WaitFor(qdrant);

builder.Build().Run();
