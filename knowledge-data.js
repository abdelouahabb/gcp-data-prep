const GCP_MODULES = [
  {
    id: "storage-warehousing",
    domain: "Domain 1 & 2: Storage & Data Warehousing",
    title: "BigQuery, Cloud Storage, Bigtable, Spanner & AlloyDB",
    icon: "database",
    badge: "35% of Exam",
    summary: "Master GCP's storage decision matrix, BigQuery internal architecture (Colossus, Borg, Dremel, Jupiter), partitioning vs clustering, Bigtable row-key design, and Spanner global consistency.",
    deepDive: [
      {
        heading: "1. BigQuery Architecture & Optimization",
        content: `BigQuery separates compute and storage completely:
- **Colossus**: Google's global distributed file system storing data in **Capacitor** (columnar format with compression and predicate pushdown).
- **Dremel**: Multi-tenant execution engine turning SQL queries into execution trees using **Slots** (units of CPU/RAM/Network).
- **Jupiter**: 1 Petabit/sec bisectional bandwidth network connecting storage and compute, enabling fast shuffles via Distributed Memory Shuffle.

### Partitioning vs. Clustering (Exam Favorite!)
| Feature | Partitioning | Clustering |
|---|---|---|
| **Mechanism** | Divides table into physical segments based on 1 column (Ingestion time, DATE/TIMESTAMP/DATETIME, or INTEGER range). | Sorts data *within* each partition (or full table) based on up to **4 columns** in specified order. |
| **Cost Guarantee** | **Deterministic cost estimation** before running the query (dry run shows exact pruned bytes). | **Non-deterministic** prior to execution; actual bytes billed may be lower than estimated after block pruning. |
| **Limit** | Max **4,000 partitions** per table (Updated to 10,000 in newer releases, but watch for high-cardinality traps!). | High cardinality columns (e.g., \`user_id\`, \`sku\`, \`SessionID\`). |
| **Best Practice** | Filter on partition column first. Enable \`require_partition_filter = true\` to prevent accidental full table scans. | Put most frequently filtered/aggregated columns first in \`CLUSTER BY col1, col2, col3\`. |

### BigQuery Security & Governance
- **Authorized Views / Authorized Datasets / Authorized Routines**: Share query results without granting access to underlying source tables. If you have 50 views in a dataset, use an **Authorized Dataset** instead of authorizing each view individually!
- **Column-Level Security**: Uses **Data Catalog Policy Tags** + IAM roles (\`Fine-Grained Reader\`). Masking policies allow showing hashes or NULLs.
- **Row-Level Security (RLS)**: Created via \`CREATE ROW ACCESS POLICY\`. Note: RLS bypasses certain metadata caching and requires careful auditing.
- **BigLake Tables**: Unified storage engine over GCS, AWS S3, and Azure Blob supporting fine-grained row/column security on external files (Parquet, ORC, Avro, Iceberg) without moving data!`
      },
      {
        heading: "2. Cloud Bigtable (Wide-Column NoSQL)",
        content: `Bigtable is a sparsely populated, distributed HBase-compatible NoSQL database designed for **> 1 TB** of data, **sub-10ms latency**, and high-throughput time-series, IoT, financial tick data, or ad-tech workloads.

### Row Key Design & Hotspotting (CRITICAL EXAM TOPIC)
Bigtable sorts rows **lexicographically by a single indexed Row Key**. Tablets (contiguous ranges of rows) are split and balanced across nodes.
- **Causes of Hotspotting (Single node bottleneck)**:
  1. **Starting row key with a monotonically increasing value** (e.g., \`20261008_device123\` or sequential auto-increment IDs). All new writes hit the exact same last tablet!
  2. **Starting with a low-cardinality attribute** (e.g., \`sensor_type#timestamp\` when there are only 3 sensor types).
- **Correct Row Key Patterns**:
  - **Field Promotion + Salting/Reversing**: \`device_id#reverse_timestamp\` (where \`reverse_timestamp = MAX_LONG - timestamp\`, great for fetching the *most recent* N records first!).
  - **Hash Prefixing / Salting**: \`MD5(user_id)[0:4]#user_id#timestamp\` — distributes sequential IDs evenly, though it makes multi-user range scans harder.
  - **Avoid many separate column qualifiers**: Prefer fewer column families (~1–5) and store values cleanly.

### Performance & Troubleshooting (\`Key Visualizer\`)
- If Bigtable latency is high, first check **Key Visualizer** for bright horizontal lines (hot keys/ranges).
- Adding nodes fixes **high CPU utilization across all nodes**, but **DOES NOT FIX hotspotting on a single row key**!
- Bigtable replication (multi-cluster routing) provides **eventual consistency** across clusters (or read-your-writes within a single cluster routing policy). Use **App Profiles** with single-cluster routing for strong consistency, or multi-cluster routing for high availability.`
      },
      {
        heading: "3. Cloud Spanner vs. Cloud SQL vs. AlloyDB",
        content: `When the requirement is **Relational (SQL) + ACID Transactions**:
- **Cloud SQL**: Regional managed MySQL, PostgreSQL, SQL Server. Up to 64 TB. Cross-zone HA via synchronous persistent disk replication; cross-region read replicas (asynchronous) for DR.
- **AlloyDB for PostgreSQL**: 4x faster than standard PostgreSQL for transactional workloads and up to **100x faster for analytical queries** (via columnar engine in memory). Ideal for hybrid transactional/analytical processing (HTAP) and enterprise Postgres migrations without moving to BigQuery immediately.
- **Cloud Spanner**: Global horizontal scale + **External Consistency (TrueTime API)** + 99.999% multi-region availability.
  - *Spanner Hotspotting*: Just like Bigtable, never use monotonically increasing primary keys (\`AUTO_INCREMENT\` or current timestamp) at the start of a Spanner Primary Key! Use **UUID v4**, bit-reversed sequences, or hash-prefixed keys.
  - *Interleaved Tables*: Co-locates child rows physically with parent rows (\`INTERLEAVE IN PARENT Orders\`) for ultra-fast joins.`
      },
      {
        heading: "4. Cloud Storage (GCS) Classes & Lifecycle",
        content: `| Storage Class | Min Duration | Availability SLA (Multi-Region) | Use Case |
|---|---|---|---|
| **Standard** | None | 99.95% | Hot data, active analytics, staging tables, frequent access |
| **Nearline** | 30 days | 99.9% | Accessed ~once a month |
| **Coldline** | 90 days | 99.9% | Accessed ~once a quarter |
| **Archive** | 365 days | 99.9% | Compliance archives, < once a year (No millisecond latency penalty! Still instant access, just higher retrieval & early deletion fees) |

- **Autoclass**: Automatically transitions objects between Standard down to Archive based on last access time (and back to Standard on read) with no early deletion fees.
- **Customer-Managed Encryption Keys (CMEK)** via Cloud KMS vs **Customer-Supplied Encryption Keys (CSEK)** (you manage raw keys on-prem, Google never stores them on disk).`
      }
    ],
    proTips: [
      "Exam Rule: 'High throughput + millisecond latency + time series / IoT' = Cloud Bigtable.",
      "Exam Rule: 'Global ACID relational database + horizontal scaling + >99.99% HA' = Cloud Spanner.",
      "Exam Rule: 'SQL Analytics + Petabyte scale + ML with SQL + ANSI SQL' = BigQuery.",
      "Exam Rule: Never add more Bigtable nodes to solve a single-tablet hotspot—redesign the row key instead!",
      "BigQuery Storage Write API is preferred over legacy tabledata.insertAll for high-throughput streaming with exactly-once semantics and lower cost."
    ],
    codeExample: `-- BigQuery Best Practice: Partitioned + Clustered Table with Partition Filter Enforcement
CREATE TABLE \`prod_analytics.events_curated\`
(
  event_timestamp TIMESTAMP NOT NULL,
  country_code STRING,
  user_id STRING,
  event_type STRING,
  revenue_usd NUMERIC
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY country_code, event_type, user_id
OPTIONS (
  partition_expiration_days = 1095,
  require_partition_filter = TRUE,
  description = "Curated event stream partitioned by day and clustered by query predicates"
);`
  },
  {
    id: "ingestion-pipelines",
    domain: "Domain 1 & 2: Ingestion & Stream/Batch Processing",
    title: "Pub/Sub, Dataflow (Apache Beam), Dataproc & Data Fusion",
    icon: "cpu",
    badge: "35% of Exam",
    summary: "Understand Pub/Sub delivery guarantees, Apache Beam windowing, watermarks, triggers, state/timers, Dataflow Shuffle vs Streaming Engine, and Dataproc optimization.",
    deepDive: [
      {
        heading: "1. Cloud Pub/Sub Internals & Ordering",
        content: `Pub/Sub is Google's global, durable asynchronous messaging ingestion bus:
- **At-least-once delivery** by default (can configure **Exactly-Once Delivery** within a region or handle deduplication downstream in Dataflow).
- **Message Retention**: Up to **31 days** on the Topic and 7 days (default) on Subscriptions.
- **Seek & Replay**:
  - **Seek to Timestamp**: Replay already-acknowledged messages if \`retain_acked_messages = true\` is enabled on the subscription (or Topic retention is configured).
  - **Seek to Snapshot**: Capture exact acknowledgment state across a subscription before deploying risky pipeline updates! If the new pipeline has a bug, seek back to the snapshot.
- **Ordering Keys**: Guarantees messages with the same ordering key are delivered in order. *Caveat*: If a message fails delivery and is redelivered, all subsequent messages with that key wait (head-of-line blocking).
- **Dead-Letter Topics (DLQ)**: Automatically routes poison-pill messages that fail delivery after \`max_delivery_attempts\` (5 to 100) to a separate topic for inspection.`
      },
      {
        heading: "2. Dataflow & Apache Beam (THE HARDEST EXAM SECTION)",
        content: `Apache Beam is the unified programming model; **Cloud Dataflow** is the serverless runner.

### Event Time vs. Processing Time & Watermarks
- **Event Time**: When the event actually occurred on the device (e.g., \`14:02:00\`).
- **Processing Time**: When Dataflow processes the event (e.g., \`14:15:00\` due to mobile offline tunnel).
- **Watermark**: Dataflow's heuristic metric estimating that *all data up to Event Time $T$ has arrived*.
- **Late Data**: Any event that arrives *after* the watermark has passed the end of its window.

### Windowing Strategies
1. **Fixed Windows (Tumbling)**: Non-overlapping fixed time intervals (e.g., every 5 minutes).
2. **Sliding Windows**: Overlapping intervals (e.g., 10-minute window computed every 1 minute). Used for moving averages!
3. **Session Windows**: Dynamic windows keyed per user/device, closing after an **inactivity gap duration** (e.g., 30 minutes of no clicks).
4. **Single Global Window**: Default for batch and unwindowed streams (requires custom triggers if aggregating unbounded data!).

### Triggers & Accumulation Modes
- \`AfterWatermark.pastEndOfWindow()\` (Default: fires once when watermark passes window end).
- \`.withEarlyFirings(AfterProcessingTime.pastFirstElementInPane().plusDelayOf(1.minute))\` — Speculative early results before window closes!
- \`.withLateFirings(AfterPane.elementCountAtLeast(1))\` — Recomputes when late data arrives inside \`withAllowedLateness(Duration.standardHours(2))\`.
- **Accumulation Modes**:
  - \`ACCUMULATING_FIRED_PANES\`: Each pane emits the **total cumulative sum** so far (ideal when overwriting a database key or downstream dashboard).
  - \`DISCARDING_FIRED_PANES\`: Each pane emits **only the delta** since the last firing (ideal when appending to a table that sums rows later).

### Core Beam Transforms & Side Inputs
- **ParDo**: Parallel 1-to-0, 1-to-1, or 1-to-N element-wise processing (like \`flatMap\`). Can emit to **Multiple Outputs (TupleTags)** for branching valid records vs dead-letter malformed records!
- **GroupByKey / CombinePerKey**: Always prefer \`CombinePerKey\` (or \`Combine.globally\`) over \`GroupByKey\` because \`CombineFn\` performs **partial pre-aggregation on workers before shuffling** (combiner lifting), drastically cutting network shuffle and hot-key bottlenecks!
- **Side Inputs**: Broadcast small slowly-changing lookup tables into a \`ParDo\`. For large rapidly-changing joins, use \`CoGroupByKey\`.`
      },
      {
        heading: "3. Dataflow Operational Excellence",
        content: `- **Dataflow Shuffle Service** (Batch) & **Streaming Engine** (Streaming): Moves shuffle state and timers off worker VMs and Persistent Disks into Google's managed backend service. Reduces worker CPU/RAM/Disk footprints and makes autoscaling much faster and smoother.
- **Dataflow Prime**: Next-gen platform with **Vertical Autoscaling** (automatically adjusts worker memory) and **Right Fitting** (stage-specific resource pools, e.g., high-memory or GPU only for ML inference stages).
- **Updating Streaming Pipelines**:
  - \`--update\` flag with matching job name: Performs an **in-place compatibility check**. Works if state/coders/windowing aren't broken.
  - **Parallel Replacement Job**: If breaking changes exist, spin up Pipeline V2 reading from a new subscription, configure Pipeline V1 to **Drain** (stops pulling new data, finishes in-flight windows), and cut over downstream views.`
      },
      {
        heading: "4. Cloud Dataproc (Managed Hadoop & Spark)",
        content: `Use Dataproc when **migrating existing Spark/Hadoop/Hive/Presto workloads** with minimal code changes.
- **Storage Separation**: **NEVER store persistent data in HDFS on Dataproc nodes!** Store data in **Cloud Storage (` + "`gs://`" + `)** using the Cloud Storage Connector (` + "`hcfs`" + `). This lets you run **ephemeral per-job clusters** and delete them immediately after job completion to save 70%+ cost!
- **Preemptible / Spot VMs**: Can be used as **Secondary Workers (compute-only, no HDFS data nodes)**. Note: If Spot VMs are reclaimed aggressively during heavy Spark shuffles, stage recomputations can slow down the job—use **Enhanced Flexibility Mode (EFM)** so primary workers hold shuffle data!
- **Dataproc Serverless**: Run PySpark/Spark batch jobs without provisioning or managing clusters at all.`
      },
      {
        heading: "5. Pipeline Tool Selection Matrix",
        content: `| Service | Best When You Need... |
|---|---|
| **Cloud Dataflow** | Serverless unified batch + streaming, complex event-time windowing, custom Python/Java/Go code, Apache Beam portability. |
| **Cloud Dataproc** | Lift-and-shift existing Apache Spark, Hadoop, Hive, Pig jobs; ML with Spark MLlib. |
| **Cloud Data Fusion** | Code-free visual GUI drag-and-drop ETL built on **CDAP**, 150+ connectors (SAP, Salesforce, Mainframe), data lineage included. |
| **Datastream** | Serverless **Change Data Capture (CDC)** from Oracle, MySQL, Postgres, SQL Server, AlloyDB directly into BigQuery or GCS with minimal latency. |
| **Cloud Composer** | Managed **Apache Airflow** for **orchestration** across GCP and multi-cloud (Note: Composer orchestrates jobs—don't execute heavy GB/TB data transformations inside Airflow worker pods; use KubernetesPodOperator or trigger Dataflow/BigQuery operators!). |
| **Dataform** | SQL-based ELT orchestration inside BigQuery (similar to dbt): manages table dependencies, assertions (data quality checks), and incremental builds via SQLX. |`
      }
    ],
    proTips: [
      "Exam Trap: 'How do you handle corrupt JSON records in a streaming Dataflow job without crashing the pipeline?' -> Wrap parsing in a try/catch inside ParDo and route failures via a secondary TupleTag to a Dead-Letter table/GCS bucket!",
      "Exam Trap: 'A Dataproc job is I/O bound reading small files from HDFS.' -> Migrate to GCS, coalesce small files into larger Parquet/Avro files, and use SSD persistent disks for shuffle if needed.",
      "Exam Trap: Never run heavy Pandas transformations directly inside a Cloud Composer PythonOperator—it will OOM the Airflow worker! Offload compute to BigQuery, Dataflow, or GKE."
    ],
    codeExample: `# Apache Beam Python: Event-Time Fixed Windows + Early/Late Triggers + Dead-Letter Branching
import apache_beam as beam
from apache_beam.transforms import window, trigger

class ParseEventFn(beam.DoFn):
    DEAD_LETTER_TAG = 'dead_letter'
    def process(self, element):
        try:
            record = json.loads(element.decode('utf-8'))
            yield beam.window.TimestampedValue(record, record['event_ts'])
        except Exception as e:
            yield beam.pvalue.TaggedOutput(self.DEAD_LETTER_TAG, {'raw': str(element), 'err': str(e)})

events, corrupt = (
    p | "ReadPubSub" >> beam.io.ReadFromPubSub(subscription=SUB_PATH)
      | "ParseWithDLQ" >> beam.ParDo(ParseEventFn()).with_outputs('dead_letter', main='valid')
)

windowed_counts = (
    events
    | "Window5Min" >> beam.WindowInto(
        window.FixedWindows(300),
        trigger=trigger.AfterWatermark(
            early=trigger.AfterProcessingTime(60),
            late=trigger.AfterCount(1)
        ),
        allowed_lateness=3600,
        accumulation_mode=trigger.AccumulationMode.ACCUMULATING
    )
    | "CountPerKey" >> beam.CombinePerKey(sum)
)`
  },
  {
    id: "ml-ai-engineering",
    domain: "Domain 2 & 3: Machine Learning & Vertex AI",
    title: "BigQuery ML, Vertex AI, Pre-trained APIs & Feature Store",
    icon: "brain",
    badge: "15% of Exam",
    summary: "Know the hierarchy of ML on GCP (Pre-trained APIs -> BigQuery ML -> AutoML -> Custom Training on Vertex AI), BQML model types, and MLOps Feature Store patterns.",
    deepDive: [
      {
        heading: "1. The GCP Machine Learning Decision Hierarchy",
        content: `On the PDE exam, **always pick the simplest, fastest, lowest-maintenance ML option** that satisfies the business requirement:

1. **Level 1: Pre-trained Cloud AI APIs** (No training data required! Ready out-of-the-box)
   - **Cloud Vision API**: OCR, label detection, explicit content moderation, product search.
   - **Document AI**: Structured form parsing, invoices, receipts, W-2s, lending documents.
   - **Cloud Natural Language API**: Sentiment analysis, entity extraction, syntax analysis, content classification.
   - **Cloud Translation / Speech-to-Text / Text-to-Speech / Video Intelligence API**.
2. **Level 2: BigQuery ML (BQML)** (Data is already in BigQuery + team knows SQL + fast prototyping)
   - Train models directly in place using SQL without exporting data or managing infrastructure!
3. **Level 3: Vertex AI AutoML** (Custom tabular, image, text, or video data + no coding/ML expertise needed + high accuracy)
   - Automatically performs feature engineering, neural architecture search, and hyperparameter tuning.
4. **Level 4: Vertex AI Custom Training** (Full control over PyTorch, TensorFlow, XGBoost, Scikit-Learn, custom loss functions, distributed GPU/TPU training).`
      },
      {
        heading: "2. BigQuery ML (BQML) Model Reference (Memorize This!)",
        content: `| Business Problem | BQML \`model_type\` | Notes |
|---|---|---|
| Predict continuous number (price, revenue, temperature) | \`LINEAR_REG\`, \`BOOSTED_TREE_REGRESSOR\`, \`DNN_REGRESSOR\`, \`RANDOM_FOREST_REGRESSOR\` | Use \`ML.EVALUATE\` (checks RMSE, MAE, $R^2$). |
| Predict category / churn / fraud (yes/no or multi-class) | \`LOGISTIC_REG\`, \`BOOSTED_TREE_CLASSIFIER\`, \`DNN_CLASSIFIER\` | Use \`ML.ROC_CURVE\`, \`ML.CONFUSION_MATRIX\`. Handle class imbalance with \`auto_class_weights = TRUE\`. |
| Customer Segmentation (Unlabeled) | \`KMEANS\` | Unsupervised clustering; standardize features automatically. |
| Time-Series Forecasting (Demand, Sales) | \`ARIMA_PLUS\` | Automatically handles **holiday effects, seasonality, trend drift, and spikes/dips**! Can forecast millions of time series concurrently via \`TIME_SERIES_ID_COL\`. |
| Recommendation Engine | \`MATRIX_FACTORIZATION\` | Collaborative filtering (User-Item-Rating). Requires flex/reservation slots in some configurations. |
| Feature Preprocessing inside Model | \`TRANSFORM(...)\` clause | **CRITICAL**: Put \`ML.STANDARD_SCALER\`, \`ML.ONE_HOT_ENCODER\`, \`ML.BUCKETIZE\` inside the \`CREATE MODEL ... TRANSFORM(...)\` clause so BigQuery automatically applies the exact same transformations during \`ML.PREDICT\` (prevents **Training-Serving Skew**!). |
| Explainability | \`ML.EXPLAIN_PREDICT\` / \`ML.GLOBAL_EXPLAIN\` | Computes Shapley values / feature attributions for predictions. |
| External Models | \`TENSORFLOW\` / Remote Vertex AI Models | Import saved TensorFlow models into BQ for batch SQL inference, or call Gemini / Vertex AI LLMs via \`ML.GENERATE_TEXT\`. |`
      },
      {
        heading: "3. Vertex AI MLOps & Preventing Training-Serving Skew",
        content: `**Training-Serving Skew** occurs when feature values or transformations during online serving differ from those used during training:
- **Cause 1**: Different code paths (e.g., SQL in BigQuery for training vs Java in production microservice for inference).
  - *Fix*: Use **BQML \`TRANSFORM\` clause**, **TensorFlow Transform (TFT)** in Dataflow, or **Vertex AI Feature Store**.
- **Cause 2**: Data leakage / Time travel (using future aggregate values when constructing historical training features).
  - *Fix*: **Vertex AI Feature Store** provides **Point-in-Time Correct Lookups** for training generation and low-latency online serving + offline batch storage.
- **Vertex AI Model Monitoring**: Detects **Feature Skew** (training vs serving distribution mismatch) and **Feature Drift** (production input data shifting over time, e.g., due to inflation or seasonal shift) and triggers alerts or Vertex AI Pipelines for automated retraining.`
      }
    ],
    proTips: [
      "Exam Rule: Whenever a question mentions 'avoid training-serving skew in BigQuery ML', the answer is ALWAYS the `TRANSFORM` clause inside `CREATE MODEL`.",
      "Exam Rule: Need real-time streaming predictions inside a Dataflow pipeline? Export the BQML or Vertex AI model and load it directly in Apache Beam using `RunInference` (for lowest latency) or call a Vertex AI Online Endpoint.",
      "Exam Rule: If your dataset has 99.8% legitimate transactions and 0.2% fraud, set `auto_class_weights = TRUE` in BQML or optimize for Precision-Recall AUC (`PR_AUC`) rather than raw accuracy!"
    ],
    codeExample: `-- BigQuery ML: Customer Churn Classifier preventing Training-Serving Skew with TRANSFORM
CREATE OR REPLACE MODEL \`analytics.churn_xgb_model\`
TRANSFORM(
  ML.STANDARD_SCALER(monthly_spend) OVER() AS scaled_spend,
  ML.QUANTILE_BUCKETIZE(tenure_months, 5) OVER() AS tenure_bucket,
  ML.FEATURE_CROSS(STRUCT(plan_tier, country)) AS tier_country_cross,
  churned_label
)
OPTIONS(
  model_type = 'BOOSTED_TREE_CLASSIFIER',
  input_label_cols = ['churned_label'],
  auto_class_weights = TRUE,
  enable_global_explain = TRUE
) AS
SELECT
  monthly_spend,
  tenure_months,
  plan_tier,
  country,
  churned_label
FROM \`analytics.customer_training_snapshot\`;`
  },
  {
    id: "security-governance-reliability",
    domain: "Domain 3 & 4: Security, Governance, Reliability & FinOps",
    title: "IAM, DLP (Sensitive Data Protection), KMS, Dataplex & FinOps",
    icon: "shield",
    badge: "15% of Exam",
    summary: "Master Sensitive Data Protection (Cloud DLP) de-identification methods, CMEK/CSEK, VPC Service Controls, Dataplex data mesh governance, and BigQuery Editions/Slots.",
    deepDive: [
      {
        heading: "1. Sensitive Data Protection (Cloud DLP) De-Identification",
        content: `Cloud DLP discovers, classifies, and de-identifies PII/PHI across BigQuery, GCS, Datastore, and streaming pipelines.

### Choosing the Right De-Identification Method (High Yield!)
| Requirement | DLP Technique | Why? |
|---|---|---|
| Completely remove or mask PII (e.g., show \`***-**-6789\` to support agents) | **Redaction** or **Character Masking** | Irreversible; hides sensitive characters while keeping partial display format. |
| Join tables on \`SSN\` or \`email\` across datasets **without** ever reversing the value | **Cryptographic Deterministic Hashing (\`CryptoHashConfig\`)** | Produces consistent token for identical inputs using a secret key (prevents rainbow table attacks unlike unsalted SHA-256). Irreversible. |
| Reversible pseudonymization AND **preserve exact format/length** (e.g., 16-digit credit card or SSN column in legacy schema) | **Format-Preserving Encryption (FPE - \`CryptoReplaceFfX509Config\`)** | Encrypts \`123-45-6789\` into \`849-10-3921\` using a KMS-wrapped key. Preserves referential integrity & schema validation, and can be decrypted if authorized! |
| Reversible encryption where output length/format doesn't matter | **Deterministic Encryption (AES-SIV)** | Reversible with key, preserves joins, outputs base64/bytes string. |
| Generalize dates to protect age/admission date while preserving intervals between events for the same patient | **Date Shifting** | Shifts all dates for a specific \`patient_id\` by the *exact same random offset* (e.g., +17 days). Preserves duration between Admission and Discharge! |
| Generalize numeric salaries or ages for k-anonymity | **Bucketing** | Replaces \`34\` with \`30-40\`. |`
      },
      {
        heading: "2. Perimeter Security & Encryption",
        content: `- **VPC Service Controls (VPC-SC)**: Creates a security perimeter around GCP managed resources (BigQuery, GCS, Pub/Sub, Bigtable) to **prevent data exfiltration** (e.g., stops an insider with stolen credentials from running \`SELECT * INTO external_project.dataset.table\` or copying GCS buckets to a personal project).
- **Private Google Access**: Allows VMs **without external IP addresses** (recommended for Dataproc and Dataflow workers using \`--use_public_ips=false\`) to reach Google APIs and services over Google's internal network.
- **Encryption Options**:
  1. **Google-managed default encryption**: Automatic, zero configuration.
  2. **CMEK (Customer-Managed Encryption Keys)**: Keys created and rotated in **Cloud KMS** (software, Hardware HSM, or **Cloud EKM** External Key Manager). Used when compliance requires key rotation audit logs or instant revocation ("crypto-shredding").
  3. **CSEK (Customer-Supplied Encryption Keys)**: You supply the raw AES-256 key with every API call. Google never stores the key at rest.`
      },
      {
        heading: "3. Dataplex, Data Catalog & Observability",
        content: `- **Dataplex**: Intelligent **Data Mesh** fabric that lets you organize distributed data across multiple GCS buckets and BigQuery datasets into logical **Lakes** and **Zones** (Raw Zone, Curated Zone) without moving data. Automates metadata discovery, **Auto Data Quality**, data lineage, and centralizes IAM/security policy enforcement.
- **Cloud Monitoring & Logging**:
  - **Audit Logs**:
    - *Admin Activity Logs*: Always enabled, free, 400-day retention (who created/deleted a table or changed IAM).
    - *Data Access Logs*: Disabled by default for most services EXCEPT **BigQuery (where Data Access logs are enabled by default!)**. Shows who queried which table and how many bytes were scanned.
  - Exporting logs: Create a **Log Sink** at the Folder or Organization level (` + "`--include-children`" + `) routing to:
    - **BigQuery** (for SQL security analytics),
    - **Cloud Storage** (for cheap long-term 7-year compliance archival), or
    - **Pub/Sub** (for real-time SIEM streaming to Splunk/Chronicle).`
      },
      {
        heading: "4. BigQuery FinOps: On-Demand vs. Editions (Capacity Pricing)",
        content: `- **On-Demand Pricing**: Pay per TiB scanned. Best for spiky, unpredictable exploratory workloads. Use **Maximum Bytes Billed** per query or project-level **Custom Cost Quotas** to prevent runaway bills (note: Project daily byte quotas hard-stop queries once reached!).
- **BigQuery Editions (Standard, Enterprise, Enterprise Plus)**: Pay for **Slot Capacity (Autoscaling reservations)** per second/hour.
  - Assign workloads to separate **Reservations** (` + "`elt_batch`" + `, ` + "`bi_dashboards`" + `, ` + "`adhoc_ds`" + `):
    - If a reservation has idle slots, other reservations in the same administration project automatically borrow them (**Idle Slot Sharing**) and immediately return them when the owner reservation needs them!
  - **BI Engine**: In-memory analysis service that caches hot BigQuery data for sub-second Looker Studio / Looker dashboard performance and saves slot compute.`
      }
    ],
    proTips: [
      "Exam Rule: 'Prevent an authorized analyst from copying sensitive BigQuery data into their personal GCP project' -> VPC Service Controls (VPC-SC).",
      "Exam Rule: 'Preserve exact 16-digit credit card format for legacy validation AND allow joins AND allow decryption later' -> Cloud DLP Format-Preserving Encryption (FPE).",
      "Exam Rule: 'Preserve exact days elapsed between hospital check-in and check-out per patient while hiding exact dates' -> Cloud DLP Date Shifting keyed by patient_id.",
      "Exam Rule: BigQuery `SELECT * EXCEPT(col)` does NOT reduce bytes scanned much if you still select 49 out of 50 columns; select only required columns and NEVER use `LIMIT 10` expecting a cheaper scan (BigQuery still scans the whole partition unless the table is clustered!)."
    ],
    codeExample: `# gcloud Command: Create Organization-wide Log Sink to BigQuery for Compliance Auditing
gcloud logging sinks create org-security-audit-sink \\
  bigquery.googleapis.com/projects/sec-audit-prod/datasets/org_audit_logs \\
  --organization=123456789012 \\
  --include-children \\
  --log-filter='protoPayload.serviceName="bigquery.googleapis.com" OR protoPayload.serviceName="storage.googleapis.com"'`
  }
];

const DECISION_TREES = [
  {
    category: "Storage & Database Selection",
    scenario: "Which GCP Storage Service Should You Choose?",
    nodes: [
      { condition: "Unstructured blobs (Images, Video, Parquet/Avro backups, Data Lake staging)", choice: "Cloud Storage (GCS)", reason: "Object storage with 4 lifecycle tiers, BigLake integration, and infinite scalability." },
      { condition: "Structured Relational (OLTP) + Regional (< 64 TB) + MySQL/Postgres/SQL Server", choice: "Cloud SQL", reason: "Managed regional RDBMS with HA standby and read replicas." },
      { condition: "Structured Relational (OLTP + HTAP) + Enterprise Postgres + Ultra-high throughput", choice: "AlloyDB for PostgreSQL", reason: "4x faster OLTP, 100x faster analytics via built-in columnar engine." },
      { condition: "Structured Relational (OLTP) + Global Multi-Region + Horizontal Write Scaling + External Consistency", choice: "Cloud Spanner", reason: "TrueTime global ACID transactions with 99.999% SLA and unlimited horizontal scale." },
      { condition: "Analytical Data Warehouse (OLAP) + SQL + Petabyte Scale + Built-in ML", choice: "BigQuery", reason: "Serverless columnar analytics engine with Dremel/Colossus separation." },
      { condition: "NoSQL Wide-Column + High Throughput Writes + < 10ms Latency + IoT / Time-Series / AdTech", choice: "Cloud Bigtable", reason: "HBase-compatible wide-column store scaling linearly with node count." },
      { condition: "NoSQL Document Store + Mobile/Web SDK Real-Time Sync + Serverless", choice: "Firestore (Datastore)", reason: "Document database with ACID transactions and offline mobile sync." },
      { condition: "Sub-millisecond In-Memory Caching / Session Store", choice: "Memorystore (Redis / Memcached)", reason: "Fully managed in-memory key-value cache." }
    ]
  },
  {
    category: "Data Ingestion & Processing Selection",
    scenario: "Which Pipeline & Integration Service Fits the Requirement?",
    nodes: [
      { condition: "Global Event Ingestion Bus + Decoupling Microservices/IoT + Replayable Stream", choice: "Cloud Pub/Sub", reason: "Durable messaging with Seek/Snapshots, Ordering Keys, and Dead-Letter Topics." },
      { condition: "Serverless Unified Batch & Streaming + Event-Time Windowing + Late Data Handling", choice: "Cloud Dataflow (Apache Beam)", reason: "Autoscaling, Streaming Engine, exactly-once processing, and dynamic work rebalancing." },
      { condition: "Lift-and-Shift Existing Apache Spark / Hadoop / Hive / Presto Cluster Workloads", choice: "Cloud Dataproc", reason: "Managed Spark/Hadoop clusters using GCS instead of HDFS for ephemeral job clusters." },
      { condition: "Visual Drag-and-Drop GUI ETL + Enterprise Connectors (SAP, Salesforce) + Zero Code", choice: "Cloud Data Fusion", reason: "Managed CDAP with visual pipeline studio and automated data lineage." },
      { condition: "Agentless Change Data Capture (CDC) from Oracle/MySQL/Postgres to BigQuery/GCS", choice: "Datastream", reason: "Serverless low-latency CDC replication." },
      { condition: "SQL-Centric ELT Transformations, Table Dependency DAGs & Assertions inside BigQuery", choice: "Dataform", reason: "Native SQLX repository in BigQuery managing views, incremental tables, and data quality tests." },
      { condition: "Cross-Service Workflow Orchestration (Scheduling DAGs across GCP, On-Prem & Multi-Cloud)", choice: "Cloud Composer (Apache Airflow)", reason: "Managed Airflow orchestrator (triggers jobs; never process bulk data in Airflow workers)." }
    ]
  },
  {
    category: "Machine Learning Selection",
    scenario: "Which GCP ML Path Minimizes Effort & Time-to-Value?",
    nodes: [
      { condition: "Standard Vision, OCR, Speech, Translation, Sentiment, or Invoice/Form Extraction (No custom training needed)", choice: "Pre-Trained Cloud AI APIs / Document AI", reason: "Zero training data required; immediate REST/gRPC API call." },
      { condition: "Structured Tabular Data in BigQuery + SQL Analysts + Fast Prototyping (Forecasting, Churn, Regression, K-Means)", choice: "BigQuery ML (BQML)", reason: "Train and predict directly inside BigQuery using SQL with zero data movement." },
      { condition: "Custom Tabular/Image/Text Dataset + High Accuracy Required + No ML Coding Needed", choice: "Vertex AI AutoML", reason: "Automated neural architecture search and feature engineering without writing Python model code." },
      { condition: "Custom Neural Architecture (PyTorch, TensorFlow, JAX) + GPUs/TPUs + Full Control", choice: "Vertex AI Custom Training", reason: "Serverless custom containers or pre-built containers with hyperparameter tuning and Vertex Pipelines." }
    ]
  }
];

const CHEAT_CARDS = [
  {
    title: "BigQuery Cost & Performance",
    items: [
      "NEVER use `SELECT *`. Project only needed columns.",
      "`LIMIT` does NOT reduce bytes scanned unless table is clustered on the filter/sort keys.",
      "Partition by `DATE/TIMESTAMP` (max 4,000–10,000 partitions); Cluster by up to 4 high-cardinality columns.",
      "Avoid self-joins; use ANSI SQL Window Functions (`LAG`, `LEAD`, `ROW_NUMBER() OVER(...)`).",
      "Filter as early as possible before `JOIN`s; put largest table first in standard joins (though BQ optimizer reorders automatically, explicit CTE filtering helps readability).",
      "Use `APPROX_COUNT_DISTINCT()` instead of `COUNT(DISTINCT)` when 1% error is acceptable for massive speedups."
    ]
  },
  {
    title: "Bigtable Anti-Patterns vs Fixes",
    items: [
      "BAD Key: `timestamp#device_id` -> Causes hotspotting on a single node!",
      "BAD Key: `sequential_id` -> Monotonically increasing writes hit one tablet.",
      "GOOD Key: `device_id#reverse_timestamp` -> Spreads writes across devices and puts latest records first.",
      "Single-cluster routing = Strong consistency (read-your-writes); Multi-cluster routing = High Availability + Eventual consistency.",
      "Scaling nodes takes ~20 minutes to rebalance tablets; scale *proactively* before expected traffic spikes!"
    ]
  },
  {
    title: "Dataflow / Apache Beam Gotchas",
    items: [
      "`CombinePerKey` > `GroupByKey` (Combiner lifting reduces shuffle data over network).",
      "Hot Key in `GroupByKey`? Add `.withHotKeyFanout()` to distribute aggregation across intermediate sub-keys.",
      "Small lookup table (<100MB) in streaming? Use `AsSingleton` / `AsDict` **Side Input**.",
      "Corrupt record handling? Use `ParDo` with `TaggedOutput` (TupleTags) to branch bad records to Dead-Letter queue.",
      "Enable **Streaming Engine** & **Dataflow Shuffle** to offload state from worker persistent disks."
    ]
  },
  {
    title: "Cloud DLP & Security Quick Lookup",
    items: [
      "**FPE (Format-Preserving Encryption)**: Keeps exact format (`XXX-XX-XXXX`), reversible with KMS key.",
      "**CryptoHash**: Deterministic one-way hash using secret key; preserves joins across tables, irreversible.",
      "**Date Shifting**: Shifts dates per entity ID by a random constant offset; preserves relative day intervals.",
      "**VPC Service Controls**: Prevents data exfiltration across project boundaries.",
      "**Authorized Views / Datasets**: Share specific query results without granting access to raw underlying tables."
    ]
  }
];
