using Projects;

var builder = DistributedApplication.CreateBuilder(args);

var qdrant = builder.AddQdrant("qdrant")
    .WithDataVolume()
    .WithLifetime(ContainerLifetime.Persistent);

var api = builder.AddProject<KbRag_Api>("kbrag-api")
    .WithReference(qdrant)
    .WaitFor(qdrant);

var frontend = builder.AddJavaScriptApp("frontend", "../../frontend")
    .WithNpm()
    .WithReference(api)
    .WithHttpEndpoint(port: 3010, env: "PORT")
    .WithEnvironment("API_URL", api.GetEndpoint("http"))
    .WaitFor(api)
    .WithExternalHttpEndpoints();

builder.Build().Run();