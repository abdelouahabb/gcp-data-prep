const EXAM_QUESTIONS = [
  {
    id: 1,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Hard",
    topic: "Cloud Bigtable Row Key Design",
    question: "A global logistics company tracks 500,000 delivery trucks emitting GPS telemetry every 5 seconds. They store this data in Cloud Bigtable to power a real-time fleet dashboard that queries the most recent 20 locations for a specific truck ID. During peak hours, write latency spikes above 500ms even though average cluster CPU utilization is below 35%. Key Visualizer shows a single bright horizontal band at the bottom of the keyspace. How should you redesign the row key?",
    options: [
      "A. Change the row key from `timestamp#truck_id` to `truck_id#reverse_timestamp` where `reverse_timestamp` is `MAX_LONG - epoch_timestamp`.",
      "B. Increase the number of Cloud Bigtable nodes in the cluster by 100% and enable SSD storage.",
      "C. Change the row key to `region_id#timestamp#truck_id` where `region_id` represents the 4 continental regions.",
      "D. Add a secondary index on the `truck_id` column family in Cloud Bigtable and enable multi-cluster routing."
    ],
    correctIndex: 0,
    explanation: "Starting a Bigtable row key with a monotonically increasing timestamp (`timestamp#truck_id`) forces all concurrent writes onto the single tablet handling the latest lexicographical range (hotspotting). Adding nodes (Option B) does not help because a single tablet still resides on a single node. Using `truck_id#reverse_timestamp` (Option A) distributes writes evenly across 500,000 truck prefixes AND stores each truck's newest records first, allowing the dashboard to fetch the latest 20 records with a fast row prefix scan and limit.",
    wrongReasons: {
      1: "Adding nodes does not split a single hot row range that is receiving sequential timestamp writes at the tail end.",
      2: "Having only 4 `region_id` prefixes still concentrates all writes across just 4 tablets, causing severe hotspotting.",
      3: "Bigtable only indexes the single row key; it does not support native secondary indexes on column families without maintaining a separate index table."
    }
  },
  {
    id: 2,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Hard",
    topic: "Apache Beam Windowing & Triggers",
    question: "You are building a streaming pipeline in Cloud Dataflow (Apache Beam) reading clickstream events from Pub/Sub. Business analysts need a BigQuery dashboard updated every minute with preliminary 1-hour revenue totals per product category. However, mobile devices frequently lose connectivity and send events up to 3 hours late. When late events arrive, the dashboard must show the updated cumulative total for that 1-hour window. How should you configure the Beam window and trigger?",
    options: [
      "A. Use 1-hour Sliding Windows every 1 minute with `AfterProcessingTime` trigger and `DISCARDING_FIRED_PANES`.",
      "B. Use 1-hour Fixed Windows with `AfterWatermark.pastEndOfWindow()`, `.withEarlyFirings(AfterProcessingTime.pastFirstElementInPane().plusDelayOf(1 minute))`, `.withLateFirings(AfterPane.elementCountAtLeast(1))`, `allowed_lateness=3 hours`, and `ACCUMULATING_FIRED_PANES`.",
      "C. Use 1-hour Session Windows with a 3-hour gap duration and `DISCARDING_FIRED_PANES`.",
      "D. Use a Global Window with a repeated 1-minute processing time trigger and filter events by timestamp in BigQuery."
    ],
    correctIndex: 1,
    explanation: "The requirement specifies 1-hour non-overlapping intervals (Fixed Windows), speculative updates every 1 minute before the watermark closes (`withEarlyFirings`), handling data up to 3 hours late (`allowed_lateness=3 hours` + `withLateFirings`), and replacing/updating the total cumulative value (`ACCUMULATING_FIRED_PANES`).",
    wrongReasons: {
      0: "Sliding windows compute overlapping moving averages rather than distinct 1-hour buckets, and `DISCARDING_FIRED_PANES` only emits deltas rather than the updated cumulative total.",
      2: "Session windows group by user inactivity gaps rather than fixed 1-hour clock intervals.",
      3: "Global windows do not group into 1-hour event-time windows automatically and lose watermark completeness semantics."
    }
  },
  {
    id: 3,
    domain: "Domain 4: Ensuring Solution Quality (Security & Privacy)",
    difficulty: "Hard",
    topic: "Sensitive Data Protection (Cloud DLP)",
    question: "A healthcare provider is migrating patient records to BigQuery. Data scientists need to analyze the exact number of days between hospital admission, surgical procedures, and discharge for each patient, as well as join patient records across three separate tables using `patient_ssn`. Compliance requires that actual admission dates and actual SSNs cannot be viewed by data scientists, and the `patient_ssn` column in legacy downstream tools strictly validates for an 11-character `XXX-XX-XXXX` format. Which Cloud DLP de-identification transformations should you use?",
    options: [
      "A. Use Bucketing for the dates and Cryptographic Hashing (`CryptoHashConfig`) for `patient_ssn`.",
      "B. Use Date Shifting keyed by `patient_id` for the dates, and Format-Preserving Encryption (FPE) with a Cloud KMS wrapped key for `patient_ssn`.",
      "C. Use Redaction for the dates and Character Masking (`***-**-XXXX`) for `patient_ssn`.",
      "D. Use Date Shifting without a context key for the dates, and AES-SIV Deterministic Encryption for `patient_ssn`."
    ],
    correctIndex: 1,
    explanation: "Date Shifting keyed by `patient_id` shifts all timestamps for a given patient by the exact same random day offset (e.g., +42 days), preserving the exact duration between admission, surgery, and discharge while hiding the real calendar dates. Format-Preserving Encryption (FPE) deterministically encrypts `patient_ssn` while preserving the exact `XXX-XX-XXXX` format and enabling joins across tables.",
    wrongReasons: {
      0: "Bucketing generalizes dates into ranges (losing exact day intervals), and `CryptoHashConfig` outputs a hex/base64 hash string that breaks the 11-character `XXX-XX-XXXX` format validation.",
      2: "Redaction deletes dates completely, and Character Masking destroys uniqueness (many patients share the last 4 digits), breaking joins.",
      3: "Date Shifting without an entity key shifts every date column by a different random offset, destroying intervals; AES-SIV changes the string format/length."
    }
  },
  {
    id: 4,
    domain: "Domain 3: Operationalizing Machine Learning Models",
    difficulty: "Medium",
    topic: "BigQuery ML & Training-Serving Skew",
    question: "Your analytics team trained a BigQuery ML `BOOSTED_TREE_CLASSIFIER` model to predict credit default. During training, the analyst manually normalized `annual_income` using `ML.STANDARD_SCALER` and bucketized `credit_age` in a SQL `WITH` clause before passing the query to `CREATE MODEL`. Six months later, predictions generated via `ML.PREDICT` in production show degraded accuracy because the production scoring query scales `annual_income` over the small daily batch instead of using the training dataset's mean and standard deviation. How should you fix this training-serving skew with minimal code changes?",
    options: [
      "A. Export the BigQuery data to Cloud Storage and rewrite the pipeline using TensorFlow Transform (TFT) on Cloud Dataflow.",
      "B. Move `ML.STANDARD_SCALER` and `ML.BUCKETIZE` inside the `TRANSFORM(...)` clause of the `CREATE OR REPLACE MODEL` statement in BigQuery ML.",
      "C. Store the training mean and standard deviation in Cloud Memorystore for Redis and look them up via a BigQuery Remote Function.",
      "D. Switch the model type from `BOOSTED_TREE_CLASSIFIER` to `DNN_CLASSIFIER` with `enable_global_explain = TRUE`."
    ],
    correctIndex: 1,
    explanation: "When preprocessing functions (`ML.STANDARD_SCALER`, `ML.MIN_MAX_SCALER`, `ML.QUANTILE_BUCKETIZE`, `ML.ONE_HOT_ENCODER`) are placed inside the `TRANSFORM(...)` clause of `CREATE MODEL`, BigQuery ML automatically saves the exact statistics (mean, std dev, quantile boundaries) learned from the training dataset inside the model artifact and applies them identically during `ML.PREDICT`.",
    wrongReasons: {
      0: "Rewriting in Dataflow + TFT is unnecessary engineering overhead when data and model live natively in BigQuery ML.",
      2: "Memorystore + Remote Functions adds unnecessary complexity and latency when BQML `TRANSFORM` handles it natively.",
      3: "Changing model architecture does not fix feature scaling discrepancy between training and serving."
    }
  },
  {
    id: 5,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Hard",
    topic: "Apache Beam Fault Tolerance & Dead-Letter Pattern",
    question: "A streaming Cloud Dataflow pipeline reads JSON messages from Pub/Sub, parses them in a `ParDo` transform, and writes valid rows to BigQuery. Occasionally, a third-party publisher sends malformed JSON messages. Currently, whenever a malformed message arrives, the `ParDo` throws a `JsonParseException`, causing Dataflow to retry the element indefinitely and stall the streaming pipeline watermark. How should you modify the pipeline so valid messages continue processing in real time while malformed messages are captured for auditing?",
    options: [
      "A. Configure a Dead-Letter Topic on the Pub/Sub subscription with `max_delivery_attempts = 5` and let the `ParDo` continue throwing exceptions.",
      "B. Wrap the JSON parsing logic inside a `try/except` block in the `DoFn`, yield valid records to the main output, and emit malformed records using `TaggedOutput` (TupleTag) to a secondary PCollection that writes to a BigQuery dead-letter table or GCS bucket.",
      "C. Add a `Filter` transform before the `ParDo` that drops any message larger than 1 KB.",
      "D. Run the pipeline in Batch mode every hour with `--ignore_errors=true`."
    ],
    correctIndex: 1,
    explanation: "In Apache Beam / Dataflow, unhandled exceptions in a streaming `DoFn` cause infinite retries (which stalls the watermark and blocks pipeline progress). Wrapping parsing in `try/except` and branching corrupt records via `TaggedOutput` (TupleTag) into a dead-letter PCollection ensures zero pipeline stalls and complete auditability.",
    wrongReasons: {
      0: "Dataflow pulls messages in bundles and retries failed bundles internally on workers rather than NACKing individual messages back to Pub/Sub's DLQ counter immediately.",
      2: "Message size does not check JSON syntax validity.",
      3: "Switching to hourly batch violates the real-time streaming requirement, and `--ignore_errors` is not a Beam runner flag."
    }
  },
  {
    id: 6,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Medium",
    topic: "BigQuery Partitioning & Clustering Optimization",
    question: "You manage a 120 TB BigQuery table `sales_transactions` containing 5 years of retail records. Every morning, regional managers run dashboards filtering by `transaction_date` (usually the last 7 or 30 days) and filtering/grouping by `store_region`, `product_category`, and `customer_tier`. You want to minimize query cost AND ensure that analysts cannot accidentally execute a query that scans the entire 120 TB table. What should you do?",
    options: [
      "A. Partition the table by `DATE(transaction_date)`, cluster by `store_region, product_category, customer_tier`, and set `require_partition_filter = TRUE`.",
      "B. Partition the table by `store_region`, cluster by `transaction_date`, and create a BigQuery BI Engine reservation.",
      "C. Create 50 separate tables split by `store_region` and query them using wildcard tables `sales_transactions_*`.",
      "D. Cluster the table by `transaction_date, store_region, product_category, customer_tier` without partitioning, and instruct users to add `LIMIT 1000` to all queries."
    ],
    correctIndex: 0,
    explanation: "Partitioning by `DATE(transaction_date)` physically segments the 5 years of data (~1,825 partitions, well below the 4,000/10,000 limit) and guarantees deterministic cost pruning on date range filters. Setting `require_partition_filter = TRUE` rejects any query lacking a `WHERE transaction_date ...` predicate. Clustering by `store_region, product_category, customer_tier` sorts blocks inside each daily partition for fast pruning on those three columns.",
    wrongReasons: {
      1: "BigQuery only supports partitioning on Date/Timestamp/Datetime or Integer Range columns, not STRING columns like `store_region`.",
      2: "Sharding tables (wildcard tables) performs worse than native partitioning/clustering due to metadata overhead on each table.",
      3: "`LIMIT` does not prevent full table scans without partitioning, and clustering alone does not enforce `require_partition_filter`."
    }
  },
  {
    id: 7,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Hard",
    topic: "Cloud Dataproc Architecture & Cost Optimization",
    question: "Your company runs nightly Apache Spark batch jobs on an on-premises Hadoop cluster where data is stored in HDFS. You are migrating these Spark jobs to Google Cloud Dataproc. The jobs run for 2 hours every night, and the cluster sits idle for the remaining 22 hours. You want to minimize cost while ensuring that adding compute capacity for high-priority nightly runs does not risk losing persistent data or slowing down Spark shuffle stages when Spot VMs are preempted. What architecture should you implement?",
    options: [
      "A. Create a single long-running Dataproc cluster using 100% Spot VMs and store all data in local HDFS onSSD persistent disks.",
      "B. Store all persistent data in Cloud Storage (`gs://`), spin up ephemeral Dataproc clusters per job via Cloud Composer (or use Dataproc Serverless), use Spot VMs as secondary workers with Enhanced Flexibility Mode (EFM) enabled, and delete the cluster when the job finishes.",
      "C. Migrate all data to Cloud Bigtable and run Spark jobs inside Cloud Composer worker pods.",
      "D. Use a persistent Dataproc cluster and scale primary workers down to 0 nodes during the 22 idle hours."
    ],
    correctIndex: 1,
    explanation: "Decoupling storage (Cloud Storage via GCS connector) from compute allows you to create ephemeral clusters only for the 2 hours the job runs and delete them immediately afterward. Using Spot VMs as secondary workers lowers compute costs by up to 80%, and enabling Enhanced Flexibility Mode (EFM) keeps Spark shuffle data on primary workers so Spot VM preemption doesn't trigger massive stage recomputations.",
    wrongReasons: {
      0: "Dataproc requires standard primary master/workers; storing data in HDFS prevents deleting the cluster during the 22 idle hours.",
      2: "Bigtable is for NoSQL key-value access, and running Spark inside Cloud Composer Airflow worker pods causes OOM crashes.",
      3: "A Dataproc cluster cannot scale primary workers to 0 while preserving HDFS data."
    }
  },
  {
    id: 8,
    domain: "Domain 4: Ensuring Solution Quality (Security & Governance)",
    difficulty: "Medium",
    topic: "BigQuery Access Control & Authorized Datasets",
    question: "Your finance team maintains a dataset `raw_finance` containing 40 tables of sensitive payroll and ledger entries. You created a separate dataset `executive_reporting` containing 25 SQL views that aggregate data from `raw_finance`. The executive leadership group needs permission to run queries against all 25 views in `executive_reporting` and any new views added to `executive_reporting` in the future, without ever having direct read access to `raw_finance` tables. What is the most maintainable way to configure this?",
    options: [
      "A. Grant the executive group `roles/bigquery.dataViewer` on `raw_finance` and apply Column-Level Security policy tags on every column.",
      "B. Grant the executive group `roles/bigquery.dataViewer` on the `executive_reporting` dataset, and configure `executive_reporting` as an **Authorized Dataset** on the `raw_finance` dataset.",
      "C. Copy the output of the 25 views into physical tables every hour using Scheduled Queries and grant access to the physical tables.",
      "D. Manually add each of the 25 views (and every future view) as individual Authorized Views on `raw_finance`."
    ],
    correctIndex: 1,
    explanation: "Authorizing the entire `executive_reporting` dataset (Authorized Dataset) on `raw_finance` automatically authorizes all current and future views inside `executive_reporting` to read from `raw_finance`, without granting the executive group direct access to `raw_finance` and without manual per-view maintenance.",
    wrongReasons: {
      0: "Granting `dataViewer` on `raw_finance` violates the requirement that executives cannot access raw tables.",
      2: "Materializing 25 tables hourly adds unnecessary storage/compute costs and staleness.",
      3: "Authorizing views individually requires manual toil every time a new view is created."
    }
  },
  {
    id: 9,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Hard",
    topic: "Dataflow Hot Key & Shuffle Optimization",
    question: "A streaming Cloud Dataflow pipeline aggregates global ad impressions by `campaign_id` over 5-minute fixed windows using `GroupByKey` followed by a `ParDo` that sums impression counts and calculates average bid price. During a Super Bowl promotion, a single viral campaign accounts for 85% of all traffic. Pipeline latency spikes, one worker CPU stays at 100% while 19 other workers sit idle, and the watermark falls behind by 45 minutes. How should you resolve this bottleneck?",
    options: [
      "A. Increase `--max_num_workers` from 20 to 100.",
      "B. Replace `GroupByKey` + `ParDo` with `CombinePerKey` using a custom `CombineFn` and add `.withHotKeyFanout()`.",
      "C. Disable Streaming Engine and increase worker persistent disk size to 2 TB.",
      "D. Switch the windowing strategy from Fixed Windows to Session Windows."
    ],
    correctIndex: 1,
    explanation: "`GroupByKey` shuffles every raw element for a key to a single worker thread, so 85% of all Super Bowl events hit 1 worker (hot key). Replacing `GroupByKey` with `CombinePerKey` enables local partial aggregation (combiner lifting) before shuffle, and `.withHotKeyFanout()` introduces intermediate shard keys so multiple workers aggregate the viral campaign in parallel before merging the final result.",
    wrongReasons: {
      0: "Adding more workers does not help when a single key is bound to a single worker thread in `GroupByKey`.",
      2: "Disabling Streaming Engine degrades performance and does not split a hot key.",
      3: "Session windows change the business logic and still group by key on a single worker."
    }
  },
  {
    id: 10,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Medium",
    topic: "Database Migration & Change Data Capture (CDC)",
    question: "A retail enterprise wants to replicate real-time transactional changes (INSERT, UPDATE, DELETE) from an on-premises Oracle 19c database into BigQuery for near-real-time inventory analytics. They want a serverless, agentless solution that requires minimal operational overhead and automatically handles schema drift and continuous CDC replication. Which Google Cloud service should you recommend?",
    options: [
      "A. BigQuery Data Transfer Service (DTS) for Oracle.",
      "B. Datastream configured with a direct BigQuery destination (using BigQuery Storage Write API CDC).",
      "C. Cloud Composer running a Python script with `cx_Oracle` every 5 minutes using `SELECT * WHERE updated_at > last_run`.",
      "D. Database Migration Service (DMS) targeting Cloud Spanner."
    ],
    correctIndex: 1,
    explanation: "Datastream is Google Cloud's serverless, agentless Change Data Capture (CDC) service specifically built to stream real-time changes from Oracle, MySQL, PostgreSQL, SQL Server, and AlloyDB directly into BigQuery (converting CDC upserts/deletes via the Storage Write API) or Cloud Storage.",
    wrongReasons: {
      0: "BigQuery DTS supports batch transfers from Teradata, Redshift, Snowflake, and SaaS apps, not real-time log-based CDC from Oracle.",
      2: "Query-based polling in Composer misses hard `DELETE` operations, stresses the production Oracle DB, and violates the no-heavy-compute-in-Composer rule.",
      3: "DMS is designed for homogeneous/heterogeneous OLTP migrations to Cloud SQL or AlloyDB, not analytical CDC into BigQuery."
    }
  },
  {
    id: 11,
    domain: "Domain 3: Operationalizing Machine Learning Models",
    difficulty: "Medium",
    topic: "ML Service Selection Hierarchy",
    question: "An insurance company receives 200,000 scanned PDF auto-claim forms and repair invoices per day in Cloud Storage. They want to extract structured key-value fields (claimant name, policy number, itemized repair costs, total tax, and signature presence) into BigQuery tables. The engineering team has no machine learning experience and needs the system in production within two weeks. What should they use?",
    options: [
      "A. Build a custom Convolutional Neural Network (CNN) and Transformer OCR model in PyTorch and train it on Vertex AI with A100 GPUs.",
      "B. Use **Document AI** (specifically Form Parser and Invoice Parser processors) triggered via Cloud Functions/Eventarc or batch processing, writing structured JSON output to BigQuery.",
      "C. Load the raw PDF bytes into BigQuery and train a `LOGISTIC_REG` model in BigQuery ML.",
      "D. Use Cloud Speech-to-Text API followed by Cloud Translation API."
    ],
    correctIndex: 1,
    explanation: "Following the GCP ML hierarchy, always choose pre-trained specialized APIs when available. **Document AI** provides pre-trained processors for Invoices, Forms, Receipts, and Lending documents that extract structured key-value pairs, tables, and entities out-of-the-box with zero ML model training required.",
    wrongReasons: {
      0: "Training custom OCR/layout models from scratch takes months of labeling and ML expertise.",
      2: "BigQuery ML `LOGISTIC_REG` is for tabular classification, not PDF document extraction.",
      3: "Speech-to-Text is for audio files, not PDF documents."
    }
  },
  {
    id: 12,
    domain: "Domain 4: Ensuring Solution Quality (Exfiltration & Network Security)",
    difficulty: "Hard",
    topic: "VPC Service Controls (VPC-SC)",
    question: "Your CISO is concerned that a contractor who has legitimate `roles/bigquery.dataViewer` and `roles/storage.objectViewer` permissions on your production analytics project could authenticate from an unmanaged home laptop or copy sensitive BigQuery tables into their own external Google Cloud project. Which security control directly prevents both unauthorized network access and cross-project data exfiltration for managed services like BigQuery and Cloud Storage?",
    options: [
      "A. Configure Customer-Managed Encryption Keys (CMEK) in Cloud KMS.",
      "B. Place the production project inside a **VPC Service Controls (VPC-SC)** perimeter and attach an Access Context Manager (ACM) access level requiring corporate device certificates/IP ranges.",
      "C. Enable VPC Flow Logs on the default VPC network and set up firewall rules blocking port 443.",
      "D. Enable BigQuery `require_partition_filter` on all tables."
    ],
    correctIndex: 1,
    explanation: "VPC Service Controls (VPC-SC) wraps Google-managed APIs (BigQuery, GCS, Pub/Sub, etc.) in a logical security perimeter that blocks data movement (`bq cp`, `SELECT INTO`, `gsutil cp`) to projects outside the perimeter. Combining VPC-SC with Access Context Manager (ACM) enforces context-aware access (corporate IP, corp-managed device via BeyondCorp).",
    wrongReasons: {
      0: "If a user has legitimate `dataViewer` permissions and KMS decrypt access to read the table, CMEK will not stop them from copying the decrypted results to another project.",
      2: "BigQuery and GCS are multi-tenant Google APIs, not VM instances constrained solely by standard VPC port 443 firewall rules.",
      3: "`require_partition_filter` is a cost control feature, not a security perimeter."
    }
  },
  {
    id: 13,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Hard",
    topic: "Updating Production Streaming Pipelines & Pub/Sub Seek",
    question: "You deployed version 2.0 of a streaming Cloud Dataflow pipeline at 10:00 AM using `--update`. At 11:30 AM, you discover a logic bug in version 2.0 that corrupted calculations written to BigQuery between 10:00 AM and 11:30 AM. The upstream Cloud Pub/Sub subscription has `retain_acked_messages = true` and a 7-day retention window. How can you reprocess the exact messages from 10:00 AM onward with a fixed version 2.1 pipeline?",
    options: [
      "A. Ask all upstream publishers to re-send all events generated since 10:00 AM.",
      "B. Delete the corrupted BigQuery rows from 10:00 AM onward, deploy pipeline version 2.1, and use **Pub/Sub Seek** (`gcloud pubsub subscriptions seek --time=...`) to rewind the subscription back to 10:00 AM.",
      "C. Enable Pub/Sub Ordering Keys to automatically roll back acknowledged messages.",
      "D. Restart the Dataflow worker VMs using `gcloud compute instances reset`."
    ],
    correctIndex: 1,
    explanation: "When `retain_acked_messages = true` (or topic retention is active), Cloud Pub/Sub allows you to **Seek** a subscription back to a past timestamp (`--time`) or a pre-deployment **Snapshot** (`--snapshot`), marking all messages since 10:00 AM as unacknowledged so the fixed Dataflow pipeline reprocesses them.",
    wrongReasons: {
      0: "Re-publishing from external client devices is rarely feasible and unnecessary when Pub/Sub retains messages.",
      2: "Ordering keys control message delivery order per key, not message replay.",
      3: "Resetting worker VMs does not replay messages already acknowledged to Pub/Sub."
    }
  },
  {
    id: 14,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Medium",
    topic: "Cloud Spanner Schema Design & Hotspotting",
    question: "You are designing a global order management database in **Cloud Spanner** that must support 150,000 writes per second across three continents. Your initial schema uses `OrderId INT64` populated by a monotonically increasing counter (1, 2, 3...) as the Primary Key of the `Orders` table, and a `LineItems` table that joins frequently with `Orders`. What two changes should you make to follow Cloud Spanner best practices?",
    options: [
      "A. Change `OrderId` to a **UUID v4** (or bit-reversed sequence/hash prefix) to prevent split hotspotting, and define `LineItems` as an **Interleaved Table** (`INTERLEAVE IN PARENT Orders`) to co-locate child rows with parent orders.",
      "B. Prefix `OrderId` with the current `TIMESTAMP` and store `LineItems` in Cloud Bigtable.",
      "C. Keep the sequential `OrderId` and create 10 read replicas in the same zone.",
      "D. Partition the Cloud Spanner table by `DATE(order_timestamp)` using `PARTITION BY` syntax."
    ],
    correctIndex: 0,
    explanation: "Like Bigtable, Cloud Spanner lexicographically sorts splits by Primary Key. Sequential integers or leading timestamps cause all inserts to hit a single split server (hotspotting). Using UUID v4 or bit-reversed sequences spreads writes across all splits. Furthermore, `INTERLEAVE IN PARENT Orders` physically co-locates `LineItems` rows with their parent `Orders` row in the same storage split, making joins local and ultra-fast.",
    wrongReasons: {
      1: "Prefixing with current `TIMESTAMP` is also monotonically increasing and causes severe hotspotting!",
      2: "Read replicas do not scale write hotspotting on a sequential primary key.",
      3: "`PARTITION BY` is BigQuery DDL syntax, not Cloud Spanner."
    }
  },
  {
    id: 15,
    domain: "Domain 4: Ensuring Solution Quality (FinOps & Slot Management)",
    difficulty: "Medium",
    topic: "BigQuery Editions, Reservations & Idle Slot Sharing",
    question: "Your organization switched from BigQuery On-Demand pricing to **BigQuery Enterprise Edition** with a baseline commitment of 2,000 slots across an Administration Project. You have two workloads: `prod-etl-project` (which runs heavy batch jobs at the top of each hour) and `bi-dashboard-project` (which serves executive Looker dashboards throughout the day). You want to ensure `prod-etl-project` is guaranteed 1,200 slots and `bi-dashboard-project` is guaranteed 800 slots, while allowing either project to automatically use unused slots from the other when available. How should you configure this?",
    options: [
      "A. Create two separate Reservations (`etl_res` with 1,200 baseline slots and `bi_res` with 800 baseline slots) inside the same Administration Project, assign the respective projects to them, and keep **Idle Slot Sharing** enabled (default).",
      "B. Put both projects on On-Demand pricing and set `maximum_bytes_billed` to 1,200 GB.",
      "C. Create two separate GCP Organizations so slots cannot cross boundaries, and write a Cloud Function to resize reservations every 5 minutes.",
      "D. Assign both projects to the `NONE` reservation."
    ],
    correctIndex: 0,
    explanation: "In BigQuery Reservations / Editions, creating distinct Reservations (`etl_res` = 1,200, `bi_res` = 800) guarantees each workload its dedicated baseline slots whenever needed. Because **Idle Slot Sharing** (`ignore_idle_slots = false`) is enabled by default within the same Administration Project, `bi-dashboard-project` can seamlessly borrow unused slots from `etl_res` when ETL jobs aren't running, and `etl_res` immediately reclaims them with priority when ETL starts.",
    wrongReasons: {
      1: "On-demand pricing bills by bytes scanned and does not provide dedicated slot reservations.",
      2: "Idle slots cannot be shared across different Administration Projects/Organizations, and manual Cloud Function resizing is unnecessary.",
      3: "Assigning a project to `NONE` forces that project back to On-Demand per-TiB billing!"
    }
  }
];
// Append 5 additional high-yield scenario questions to EXAM_QUESTIONS
EXAM_QUESTIONS.push(
  {
    id: 16,
    domain: "Domain 3: Operationalizing Machine Learning Models",
    difficulty: "Hard",
    topic: "BigQuery ML Time-Series Forecasting at Scale",
    question: "A global retail chain wants to forecast daily demand for the next 30 days across 50,000 individual store-SKU combinations stored in a single BigQuery table `daily_sku_sales(sale_date, store_id, sku_id, units_sold)`. They need the model to automatically adjust for regional holidays, weekly/yearly seasonality, trend changes, and promotional spikes without writing thousands of separate SQL queries. How should you build this in BigQuery ML?",
    options: [
      "A. Train a single `ARIMA_PLUS` model with `TIME_SERIES_TIMESTAMP_COL = 'sale_date'`, `TIME_SERIES_DATA_COL = 'units_sold'`, `TIME_SERIES_ID_COL = ['store_id', 'sku_id']`, and `HOLIDAY_REGION = 'GLOBAL'`.",
      "B. Write a Python loop in Cloud Composer that creates 50,000 separate `LINEAR_REG` models in BigQuery ML.",
      "C. Train a single `KMEANS` model with `NUM_CLUSTERS = 30`.",
      "D. Export the table to Cloud Bigtable and use `ML.FORECAST` directly on Bigtable."
    ],
    correctIndex: 0,
    explanation: "BigQuery ML's `ARIMA_PLUS` model natively supports forecasting up to millions of time series simultaneously in a single `CREATE MODEL` statement by passing an array of identifier columns to `TIME_SERIES_ID_COL = ['store_id', 'sku_id']`. It also automatically decomposes trend, seasonality, step changes, and regional holidays (`HOLIDAY_REGION`).",
    wrongReasons: {
      1: "50,000 separate SQL statements are slow, hit metadata/quota limits, and `LINEAR_REG` lacks ARIMA seasonality/holiday decomposition.",
      2: "`KMEANS` is for unsupervised clustering, not time-series forecasting.",
      3: "`ML.FORECAST` is a BigQuery ML function, not a Cloud Bigtable feature."
    }
  },
  {
    id: 17,
    domain: "Domain 2: Ingesting and Processing the Data",
    difficulty: "Medium",
    topic: "Apache Beam Side Inputs vs CoGroupByKey",
    question: "You have a streaming Cloud Dataflow pipeline processing 100,000 purchase events per second from Pub/Sub. Each event contains a `currency_code` (e.g., EUR, JPY, GBP) that must be converted to USD using an exchange-rate table stored in BigQuery (`< 200 rows`, updated once every 6 hours). What is the most efficient way to join the streaming purchase events with the exchange rates in Apache Beam?",
    options: [
      "A. Execute a synchronous `SELECT` query to BigQuery inside the `process()` method of `ParDo` for every incoming message.",
      "B. Load the exchange-rate table as a slowly-changing **Side Input** (`AsDict` / `AsSingleton` with a periodic impulse/window refresh every 6 hours) into the `ParDo` transform.",
      "C. Use `CoGroupByKey` in a 1-second fixed window joining both streams.",
      "D. Write the raw events to Cloud Storage and run a daily batch Dataproc job."
    ],
    correctIndex: 1,
    explanation: "Because the exchange-rate lookup table is tiny (< 200 rows) and changes slowly (every 6 hours), broadcasting it into worker memory as a **Side Input** (`AsDict`) inside `ParDo` avoids network shuffles and avoids hammering BigQuery with 100,000 queries per second.",
    wrongReasons: {
      0: "BigQuery has concurrent interactive query quotas and high per-query latency (~200ms+); calling it per element at 100k/sec will immediately hit quota errors and stall the pipeline.",
      2: "`CoGroupByKey` requires a full network shuffle of the 100k/sec stream by `currency_code` (only ~150 keys, creating hot keys).",
      3: "Violates real-time streaming processing requirements."
    }
  },
  {
    id: 18,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Medium",
    topic: "BigLake & Multi-Cloud / External Governance",
    question: "Your organization stores 400 TB of Apache Parquet files in Cloud Storage buckets. Multiple teams query these files from both BigQuery and Apache Spark on Dataproc. Compliance requires you to enforce fine-grained **Row-Level Security** and **Column-Level Security (Policy Tags)** on these Parquet files without duplicating or loading the data into native BigQuery storage. What should you configure?",
    options: [
      "A. Create standard Hive-partitioned External Tables in BigQuery using the user's own GCS credentials.",
      "B. Create **BigLake Tables** over the Cloud Storage Parquet files using a **Cloud Resource Connection** service account, and attach Data Catalog Policy Tags and Row Access Policies.",
      "C. Grant all users `roles/storage.objectAdmin` on the GCS bucket and rely on client-side Spark filters.",
      "D. Move the 400 TB of Parquet files into Cloud SQL for PostgreSQL."
    ],
    correctIndex: 1,
    explanation: "**BigLake Tables** delegate GCS bucket access to a centralized Cloud Resource Connection service account. This allows administrators to revoke direct user access to the underlying GCS Parquet files while enforcing unified Row-Level Security, Column-Level Security (Policy Tags + Dynamic Data Masking), and metadata caching across both BigQuery and Spark (via the BigQuery Connector).",
    wrongReasons: {
      0: "Standard External Tables require users to have direct `storage.objects.get` access to the underlying GCS files, bypassing row/column security.",
      2: "Granting `objectAdmin` exposes all raw rows and columns in GCS directly.",
      3: "Cloud SQL has a 64 TB limit and is an OLTP database, not a petabyte data lake engine."
    }
  },
  {
    id: 19,
    domain: "Domain 4: Ensuring Solution Quality (Troubleshooting Cloud Composer)",
    difficulty: "Hard",
    topic: "Cloud Composer (Apache Airflow) Anti-Patterns",
    question: "Your team uses Cloud Composer 2 to orchestrate daily data pipelines. Recently, a data engineer added a new DAG containing a `PythonOperator` task that downloads a 15 GB CSV file from Cloud Storage into memory using `pandas.read_csv()`, performs complex aggregations, and uploads the result to BigQuery. Whenever this task runs, it fails with a `Sigkill / OutOfMemory (OOM)` error and causes adjacent Airflow tasks to fail. What is the best practice to fix this?",
    options: [
      "A. Keep the `PythonOperator` code as-is and upgrade the Cloud Composer environment scheduler CPU to the maximum size.",
      "B. Refactor the DAG to use `BigQueryInsertJobOperator` (loading the CSV directly into a staging BigQuery table and transforming via SQL) or trigger a serverless `Dataflow` / `GKEStartPodOperator` job so heavy data processing does not execute inside Airflow worker pods.",
      "C. Split the `PythonOperator` into 500 parallel `PythonOperator` tasks inside the same Airflow worker.",
      "D. Store the 15 GB CSV file inside the Airflow metadata database using XComs."
    ],
    correctIndex: 1,
    explanation: "Cloud Composer (Apache Airflow) is an **orchestrator**, not a data processing engine! Running 15 GB in-memory `pandas` workloads inside Airflow workers exhausts pod memory (OOM). Offloading the ingestion and transformation to BigQuery (`BigQueryInsertJobOperator` / `GCSToBigQueryOperator`) or Dataflow/Dataproc keeps Airflow workers lightweight and reliable.",
    wrongReasons: {
      0: "Upgrading the scheduler does not fix worker OOMs and treats Composer as a compute engine.",
      2: "500 parallel tasks in the same worker pool will still exhaust worker RAM/CPU.",
      3: "Airflow XComs are strictly for tiny metadata payloads (KB scale, like job IDs or file URIs), never multi-gigabyte datasets!"
    }
  },
  {
    id: 20,
    domain: "Domain 1: Designing Data Processing Systems",
    difficulty: "Medium",
    topic: "BigQuery Streaming Ingestion: Storage Write API",
    question: "You are designing a high-throughput telemetry ingestion pipeline that writes 2 GB/sec of structured records into BigQuery. You need **exactly-once delivery semantics**, support for stream-level transactions (committing streams atomically), and the lowest possible BigQuery ingestion cost. Which ingestion method should you use?",
    options: [
      "A. Legacy `tabledata.insertAll` streaming API with `skipInvalidRows = true`.",
      "B. **BigQuery Storage Write API** using committed or pending streams with protocol buffers.",
      "C. Execute individual `INSERT INTO dataset.table VALUES (...)` DML statements for each event.",
      "D. Write JSON files to Cloud Filestore and mount them in BigQuery."
    ],
    correctIndex: 1,
    explanation: "The **BigQuery Storage Write API** is the modern replacement for `tabledata.insertAll`. It uses gRPC streaming and Protocol Buffers, provides native **exactly-once delivery** via stream offsets, supports atomic stream commits, has 2 TB/month free tier, and costs half as much as the legacy streaming API.",
    wrongReasons: {
      0: "Legacy `tabledata.insertAll` is twice as expensive and only provides best-effort deduplication via `insertId` within a 1-minute window.",
      2: "BigQuery DML `INSERT` statements have strict concurrency/rate quotas and are meant for batch mutations, not 2 GB/sec event streaming.",
      3: "BigQuery cannot mount Cloud Filestore NFS shares."
    }
  }
);
