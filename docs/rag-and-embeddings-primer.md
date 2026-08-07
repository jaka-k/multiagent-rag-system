# RAG & embeddings — reference notes

A consolidated record of the design discussions that shaped the embedding and retrieval pipeline in this repo. Written so each section stands alone — skim the headings, read what's load-bearing for the question you have.

---

## 1. The two real failure modes of whole-document embedding

People talk about chunking like it's a single concern. It's not — there are two independent failure modes, and they need different fixes.

### Input-token limit (correctness)

Every embedding model has a hard input limit. Past it, the API silently truncates. There is no exception, no log line, no flag on the resulting vector — the truncated portion just doesn't influence the embedding. This is what was happening with whole-chapter embedding on `text-embedding-004` (2048-token cap): roughly the first quarter of each long technical chapter was reaching the index.

If a model truncates silently, you can't trust embeddings of any document near the limit. A bigger model with a 32K limit eliminates this failure mode for typical documents, but doesn't fix the next one.

### Embedding fidelity (quality)

Even when the input fits, you're squashing N tokens into a single fixed-dimension vector. The vector becomes the *average* semantic signal of the input.

Concrete example: a user asks "how does Python's GIL work?". The chapter "Concurrency" mentions the GIL in three paragraphs out of forty. The chapter-level vector is dominated by the other 37 paragraphs (threads, asyncio, multiprocessing, locks…). Cosine similarity against the query is *diluted* — the chapter may rank below a less-relevant chapter that happens to mention GIL more centrally.

Bigger embedding models (3072 dims instead of 768) reduce dilution but don't eliminate it. Chunking does.

The BEIR and MTEB retrieval benchmarks consistently show that 200–800 token chunks beat document-level vectors on precision@k for narrow queries. The gap is largest for "needle in haystack" queries — exactly the kind users actually ask in technical Q&A.

---

## 2. Distance metrics — what actually gets computed

`langchain-postgres` `PGVector` supports three distance strategies. Pick by content type:

| Metric | Formula | Range | Best for |
|---|---|---|---|
| **Cosine** | `1 − (a · b) / (‖a‖ ‖b‖)` | 0 (identical) → 2 (opposite) | **Text** — most embedding models are L2-normalised, so cosine is the right inner product to compare them |
| **L2 (Euclidean)** | `√Σ(aᵢ − bᵢ)²` | 0 → ∞ | Image/audio embeddings where magnitude matters |
| **Inner product** | `−(a · b)` | −∞ → +∞ | When you know vectors are already unit-norm and want raw speed |

Why cosine for text: modern embedding models (Gemini, OpenAI, Voyage) deliberately produce vectors close to unit norm. Cosine ignores magnitude entirely, comparing only direction — which is what "semantic similarity" actually means for normalised text embeddings.

In this repo: `PGVector` uses cosine by default (`DistanceStrategy.COSINE`). Don't change it for text embeddings.

In pgvector SQL the operators are:
- `<=>` cosine distance
- `<->` L2 distance
- `<#>` negative inner product

---

## 3. Embedding model comparison (relevant ones)

| Model | Input limit | Dim | Notes |
|---|---|---|---|
| Google `text-embedding-004` | **2048 tok** | 768 | What this repo uses. Cheap, fast, integrated via `langchain_google_genai`. Truncates silently past 2048. |
| Google `gemini-embedding-001` | 2048 tok | 768/1536/3072 (Matryoshka) | Newer Gemini model; same 2048 cap |
| OpenAI `text-embedding-3-small` | 8191 tok | 1536 (Matryoshka, ≥256) | Cheap, OpenAI dep |
| OpenAI `text-embedding-3-large` | 8191 tok | 3072 (Matryoshka, ≥256) | Higher fidelity; OpenAI dep |
| Voyage `voyage-3-large` | **32K tok** | 1024 | Largest practical input window; whole-chapter embedding actually fits |
| Cohere `embed-english-v3` | 512 tok | 1024 | Tiny window; chunk-first or skip |

**Matryoshka** = the model is trained so you can truncate the vector to a smaller dimension (e.g. 256 of the 3072) and still get useful similarity. Trades fidelity for storage / index speed. Stored dimension is configurable at insert time.

For this repo's sizing (technical books, gemini-2.5 LLM downstream, Google API key already wired): staying on `text-embedding-004` with chunking is the right call. Switching providers would matter more if you were embedding whole chapters or doing cross-lingual retrieval.

---

## 4. Chunking — sizes, overlap, splitters

**Sweet spots for retrieval** (per published benchmarks):
- 200–800 tokens for general English prose
- 800–1500 tokens for technical content where code and prose are interleaved (preserves more context per chunk)
- 150–200 token overlap so a concept that lands at a chunk boundary still appears whole in *one* of the two adjacent chunks

This repo: 1000 tokens, 150 overlap. Comfortably under the 2048 model cap.

### Token-aware splitting

`RecursiveCharacterTextSplitter.from_tiktoken_encoder(encoding_name="cl100k_base", chunk_size=N, chunk_overlap=K, separators=[…])` measures size by **tokens**, not characters. `cl100k_base` is OpenAI's tokenizer; Google's Gemini tokenizer is different but produces similar token counts on English/code text, so it's a safe approximation that leaves headroom against the 2048 cap.

### How the recursive splitter actually works

It tries each separator **in order**. For each one, it splits the input and checks whether the resulting pieces are small enough. If yes, done. If no, falls through to the next separator and splits the still-too-big pieces with that one.

So separator priority *is* a priority — the splitter prefers `\n## ` over `\n\n` over `\n` over `. ` over `" "`. Put the structurally meaningful separators **first** if you want chunks to break at those boundaries when possible.

This repo's priority for Markdown-rendered chapters:
```python
["\n## ", "\n### ", "\n#### ",
 "\n\n```", "```\n",
 "\n\n", "\n", ". ", " ", ""]
```
Result: every chunk in a typical chapter starts at a heading boundary.

---

## 5. The parent-document retrieval pattern

You can decouple *what gets embedded* from *what gets returned*. The standard pattern (LangChain calls it `ParentDocumentRetriever`):

1. **Embed** small chunks.
2. **Search** at chunk granularity (`k_raw` ≈ 15–25 raw hits).
3. **Group** hits by their `parent_id` (in this repo: `chapter_id`).
4. **Fetch** the full parent document(s) from the operational DB.
5. **Return** the top N distinct parents to the LLM (or the matching chunks, depending on context budget).

Why bigger `k_raw` than you'd think: chunk granularity means several chunks from the same chapter often hit the same query. You need a wider net at the chunk layer to be confident you've surfaced the top N *distinct* chapters.

**Bridge** between vector layer and operational DB: a single metadata field. In this repo, every chunk's `cmetadata` JSONB carries `chapter_id` (uuid string) and `chapter_tag`. The `chapter_id` is the FK back to the `Chapter` SQLModel row. No schema change, no second index.

This pattern is also what gives you clean citations downstream — the LLM cites "Chapter 4: Concurrency", not "chunk 3a7f-22".

---

## 6. Reranking — recall first, then precision

Vector similarity is fast but coarse. The pattern:

1. Pull a **wide** set of candidates (high recall, low precision) — your `k_raw=20`.
2. Apply a **slower, smarter** scorer (high precision) — the reranker.
3. Return the top few.

Three reranker flavours, in order of cost/quality:

| Approach | How | When |
|---|---|---|
| **Score aggregation** | Group by parent, take max/avg of vector similarity per parent | Cheap, no model call. Use when you just need parent-level deduplication |
| **LLM-as-judge** | Prompt a small LLM to score each candidate 0–10 vs the query | Cheap + good quality if your LLM follows JSON instructions. This repo: `gemini-2.5-flash` |
| **Cross-encoder** | A model trained specifically for query/doc pair scoring (Cohere Rerank, BGE-reranker, voyage-rerank-2) | Best quality, adds a dep |

In this repo: LLM-as-judge with `gemini-2.5-flash`. It reuses the existing Google API key, costs ~$0.0001 per query, and the JSON-mode prompt is small enough that latency is unnoticeable.

### Why LLM rerank works well

A bi-encoder embedding (query and doc encoded *separately*) produces a similarity score by inner product — fast, but the two sides can't influence each other during encoding. A cross-encoder *or* an LLM sees the query and doc **together** and can attend across both. This is the difference between "do these texts feel related on average?" and "does this specific text answer this specific question?".

### Rerank prompt design

Reliable points:
- Demand strict JSON output. No prose, no Markdown. Easy to parse, easy to fail loudly.
- Use a numeric scale (0–10), not buckets. More signal, easier to sort.
- Tell the model to **be strict**. Without that nudge, LLMs default to "everything is somewhat relevant" — clustering scores at 6–8.
- Always have a fallback: if JSON parsing fails, fall back to vector-similarity ordering. Retrieval should never *break* on a rerank parse error.

The prompt used here lives at `backend/statemachine/agents/rag/templates.py` (`RERANK_PROMPT`).

---

## 7. Why Markdown markers improve embeddings

Embedding models like `text-embedding-004` were trained on a corpus drenched in Markdown — READMEs, Stack Overflow, technical docs. The model has *learned* the semantics of:
- `## Foo` introduces a section about Foo → headings boost the chunk's signal on that topic
- `| cell | cell |` preserves row/column co-occurrence → "default port for Redis" actually clusters with "6379" instead of drifting apart
- ` ``` ` denotes code → distinct semantic subspace from prose; matches code-shaped queries better

Plain-text rendering destroys this. A 4-column reference table becomes `"Name Default Min Max foo 10 0 100 bar 5 …"` — the per-row binding between *Name* and *Default* dissolves into the embedding average.

Token cost of Markdown is real (~10–25 % extra characters for table-heavy chapters), but for 1000-token chunks the overhead is comfortable.

The same applies downstream: when the retrieved text reaches the answer LLM, Markdown is easier for it to parse, cite, and format from.

---

## 8. HTML → text pitfalls (relevant to this repo's parser)

`BeautifulSoup`'s `.get_text()` is the natural way to flatten HTML. It has two failure modes worth knowing:

1. **No separator by default.** `.get_text()` joins descendant text with `""`. Adjacent block elements run together: `<h2>Title</h2><p>Body</p>` becomes `"TitleBody"`. Pass `separator="\n"` to fix — or, better, use a structured renderer like `markdownify` so block elements get proper newlines and Markdown markers.

2. **Inline-text NavigableStrings are visited even when their parent tag isn't in your allowlist.** Iterating `start_tag.next_elements` and only processing whitelisted tags doesn't actually skip the *content* of unlisted tags — their inner NavigableStrings still appear in the traversal, and if you append them you get headerless walls of text from tables/lists/asides. Either filter them out or use a renderer that handles those tags properly.

`markdownify` solves both: it walks the tree itself, emits Markdown per-tag, and inter-block spacing is its concern, not yours. Subclass `MarkdownConverter` to override per-tag behaviour (e.g. drop `<a>` URLs, drop `<img>`).

One gotcha: `MarkdownConverter.convert_soup(tag)` on a bare `Tag` returns inline text and loses block-level prefixes like `## `. Use `convert(str(tag))` instead — the string form goes through the block-rendering path.

---

## 9. pgvector basics

The PostgreSQL extension adds a `vector(N)` column type and three distance operators (`<=>`, `<->`, `<#>`). `langchain-postgres` wraps it in a LangChain `VectorStore` interface.

### Tables it creates on first use
- `langchain_pg_collection` — one row per `collection_name`
- `langchain_pg_embedding` — `id`, `collection_id`, `embedding vector`, `document text`, `cmetadata jsonb`

The extension itself is enabled per-database with `CREATE EXTENSION vector`. In this repo, that's an Alembic migration.

### Indexes — when and which

A fresh table has **no vector index**. Queries do a sequential scan + cosine. Fine for thousands of vectors, slow past tens of thousands.

Two index types:

| Index | Build time | Recall | Query speed | Use when |
|---|---|---|---|---|
| **HNSW** | Slower to build, more memory | Higher | Faster at large scale | Default for new workloads. Tunable via `m` (graph degree) and `ef_construction` |
| **IVFFlat** | Faster to build, less memory | Lower (probabilistic) | Slower than HNSW | Older, lower-cost alternative. Tunable via `lists` |

For this repo's scale (one user, books-worth of chunks → tens of thousands of vectors), no index is needed yet. Add HNSW with `m=16, ef_construction=64` (defaults) when query latency becomes noticeable. Operator class matches the metric:

```sql
CREATE INDEX ON langchain_pg_embedding USING hnsw (embedding vector_cosine_ops);
```

### JSONB metadata
The `cmetadata` column is a true `jsonb`. You can filter on it directly: `WHERE cmetadata @> '{"chapter_id": "abc"}'`. Add a GIN index if you ever filter at scale.

### Async
`PGVector(async_mode=True, connection=engine)` accepts a SQLAlchemy `AsyncEngine`. Use `aadd_documents`, `asimilarity_search`, `asimilarity_search_with_score`. Plays cleanly with FastAPI's async stack — no thread pool, no event-loop bridge.

---

## 10. Silent truncation — why it's especially dangerous

A normal API error is loud: stack trace, log line, monitoring alert, fix. **Silent** input truncation is the opposite — your system runs forever, returning results that look reasonable but are subtly wrong.

What it looks like in practice:
- Retrieval ranks the wrong chapter first
- The answer LLM says "the document doesn't mention this" when in fact it does, in a section the embedding never saw
- Spot-checks pass (the first paragraph *is* in the index), so you don't notice for months

How to detect it:
- Tokenise every chunk before sending; assert under the model's limit
- After embedding, query `SELECT max(length(document)) FROM langchain_pg_embedding` — should sit well under the threshold-in-chars implied by the token cap (roughly ~4 chars/token for English, so 2048 tok ≈ ~8KB)
- Add a length-distribution alert in monitoring

How to prevent it:
- Chunk smaller than the model's input limit
- Pick a model whose input limit comfortably exceeds your worst-case chunk

---

## 11. Embedding dimensions and storage

| Dim | Bytes / vector (float32) | 100K vectors | 1M vectors |
|---|---|---|---|
| 256 | 1 KB | ~100 MB | ~1 GB |
| 768 | 3 KB | ~300 MB | ~3 GB |
| 1536 | 6 KB | ~600 MB | ~6 GB |
| 3072 | 12 KB | ~1.2 GB | ~12 GB |

pgvector stores vectors as 4-byte floats. Bigger dim → linearly bigger storage, linearly slower brute-force search, linearly bigger HNSW index.

Matryoshka models let you store fewer dims (e.g. 1024 from a 3072-trained model) for ~3× storage savings at modest quality loss. Worth considering if your index gets big; not yet relevant here.

---

## 12. Vector DB consolidation vs specialised vector DBs

Standalone vector DBs (Chroma, Qdrant, Weaviate, Pinecone) exist because traditional databases didn't have vector support. That's no longer true: pgvector, MySQL 8.4+, SQLite via `sqlite-vss`, MongoDB Atlas Search all do native vector search now.

When a standalone vector DB is worth the operational overhead:
- > 10M vectors with strict p99 latency requirements
- Multi-tenant isolation at the index level
- Specialised features: payload indexing, geo-vector hybrid search, distributed scale-out

When pgvector is the right answer:
- Vectors share a primary key / FK with operational data
- < 10M vectors
- You already run Postgres
- You want one backup, one healthcheck, one connection pool, one IAM model

This repo: vectors join naturally to `chapter.id`, the embedding pipeline reads from and writes to Postgres anyway, scale is bounded. Consolidation was the right call.

---

## 13. Atomicity of the embed-and-flag pattern

When you split a chapter into N chunks and embed them in batches, the worst state is a chapter with *some* chunks indexed and an `is_embedded=True` flag — retrieval will pull a misleadingly partial set, and there's no signal that the chapter needs reprocessing.

Pattern used here:
1. Collect all chunks for all pending chapters
2. Embed in batches (for API efficiency)
3. Only after **every** batch succeeds, flip `is_embedded=True` for each chapter that contributed chunks
4. Single commit at the end

On partial failure: nothing is marked done, the next run re-embeds from scratch. The retry cost is bounded by the document size and the partial work in the vector store is dead weight (orphaned by the chapter never being marked).

If retry cost ever becomes painful: switch the flag to a status enum (`idle`/`processing`/`indexed`) and track per-chunk progress, but only when this gets measurably bad.

---

## 14. Glossary of terms used here

| Term | Meaning |
|---|---|
| **Embedding** | A fixed-length vector of floats produced by a model trained so that semantically similar inputs produce similar vectors. |
| **Bi-encoder** | Architecture that encodes query and document independently into vectors. Fast — vectors precomputed, query encoded once. Bi-encoders ARE embedding models. |
| **Cross-encoder** | Architecture that takes (query, document) **together** and produces a single relevance score. Slower per pair but more accurate. Used for reranking. |
| **Recall@k** | Of all the documents that should match, fraction that appear in the top k results. Wide-net retrieval optimises this. |
| **Precision@k** | Of the top k results, fraction that are actually relevant. Reranking optimises this. |
| **HNSW** | Hierarchical Navigable Small World. The dominant approximate-nearest-neighbour index for vectors. |
| **IVFFlat** | Inverted File with Flat compression. Older approximate-NN index. |
| **Matryoshka representation learning** | Training technique that produces embeddings where any prefix slice is also a valid (lower-fidelity) embedding. |
| **Parent-document retrieval** | Embed small chunks, retrieve at parent-document granularity. |
| **Silent truncation** | An API discarding input past a model's limit without raising or warning. |
| **Token** | The unit a tokenizer (BPE, sentencepiece, …) splits text into. Roughly ¾ of a word for English. |

---

## Where this came from

These notes consolidate decisions made during the ChromaDB → pgvector migration (#6) and the chunking + rerank + Markdown-parser refactor (#7). Code references are accurate as of those PRs; if the names drift, the concepts still hold.
