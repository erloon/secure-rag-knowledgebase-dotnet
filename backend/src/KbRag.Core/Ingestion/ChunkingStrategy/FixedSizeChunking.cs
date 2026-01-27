namespace KbRag.Core.Ingestion.ChunkingStrategy;

public class FixedSizeChunking : IChunkingStrategy
{
    public IEnumerable<string> SplitText(string text)
    {
        throw new NotImplementedException();
    }

    public string Name { get; }
}