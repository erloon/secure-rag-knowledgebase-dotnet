namespace KbRag.Core.Ingestion.ChunkingStrategy;

public interface IChunkingStrategy
{
    IEnumerable<string> SplitText(string text);
    string Name { get; }
}