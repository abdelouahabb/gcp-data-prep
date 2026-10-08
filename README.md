# ☁️ Google Cloud Professional Data Engineer (PDE) — Deep-Dive & Exam Simulator

A comprehensive, zero-dependency single-page web application designed to help you master **Google Cloud Data Engineering from first principles** and pass the **Google Cloud Professional Data Engineer (PDE)** certification exam.

---

## ✨ Features

### 1. 📚 Deep-Dive Knowledge Base (`knowledge-data.js`)
Covers all 4 official PDE exam domains with internal Google Cloud architecture explanations, production SQL/Python blueprints, and **"Exam Trap Alerts"**:
- **Storage & Data Warehousing (35%)**:
  - **BigQuery Internals**: Colossus (file system), Capacitor (columnar format), Dremel (execution engine & slots), and Jupiter (1 Petabit/sec network).
  - **Partitioning vs. Clustering**: Deterministic vs. non-deterministic cost estimation, `require_partition_filter = TRUE`, and high-cardinality clustering order.
  - **Cloud Bigtable**: Lexicographical single-index row keys, preventing hotspotting (`device_id#reverse_timestamp`), Key Visualizer diagnostics, and App Profile routing (single-cluster strong consistency vs. multi-cluster high availability).
  - **Cloud Spanner & AlloyDB**: TrueTime external consistency, avoiding sequential primary key hotspots (UUID v4 / bit-reversed sequences), `INTERLEAVE IN PARENT` co-located tables, and AlloyDB HTAP columnar acceleration.
  - **Cloud Storage & BigLake**: Standard/Nearline/Coldline/Archive tiers, Autoclass, and BigLake fine-grained row/column governance over GCS Parquet/Iceberg files.
- **Ingestion & Stream/Batch Processing (35%)**:
  - **Cloud Pub/Sub**: At-least-once vs. Exactly-once delivery, Ordering Keys, Dead-Letter Topics (DLQ), and replaying data via **Seek to Timestamp / Snapshot**.
  - **Cloud Dataflow (Apache Beam)**: Event Time vs. Processing Time, Watermarks, Windowing (`Fixed`, `Sliding`, `Session`, `Global`), Triggers (`AfterWatermark`, early speculative firings, late firings), Accumulation Modes (`ACCUMULATING_FIRED_PANES` vs. `DISCARDING_FIRED_PANES`), `CombinePerKey` vs. `GroupByKey`, `.withHotKeyFanout()`, `ParDo` Dead-Letter branching with `TaggedOutput`, Side Inputs, and Streaming Engine.
  - **Cloud Dataproc**: Decoupling storage (`gs://` instead of HDFS) for ephemeral per-job clusters, Spot VMs with Enhanced Flexibility Mode (EFM), and Dataproc Serverless.
  - **Datastream, Cloud Data Fusion, Dataform & Cloud Composer**: Serverless CDC, visual CDAP pipelines, SQLX DAGs, and avoiding Airflow worker OOM anti-patterns.
- **Machine Learning & Vertex AI (15%)**:
  - **4-Tier ML Decision Hierarchy**: Pre-trained APIs (Vision, Speech, Translation, **Document AI**) $\rightarrow$ **BigQuery ML (BQML)** $\rightarrow$ **Vertex AI AutoML** $\rightarrow$ **Vertex AI Custom Training**.
  - **Preventing Training-Serving Skew**: Using the `TRANSFORM(...)` clause inside `CREATE MODEL` in BQML and **Vertex AI Feature Store** point-in-time lookups.
  - **BQML Reference**: `ARIMA_PLUS` (`TIME_SERIES_ID_COL`), `BOOSTED_TREE_CLASSIFIER` (`auto_class_weights = TRUE`), `KMEANS`, and `MATRIX_FACTORIZATION`.
- **Security, Governance, Reliability & FinOps (15%)**:
  - **Sensitive Data Protection (Cloud DLP)**: Choosing between **Format-Preserving Encryption (FPE)**, **Cryptographic Deterministic Hashing (`CryptoHashConfig`)**, **Date Shifting** (preserving intervals per entity ID), **Bucketing**, and **Redaction/Masking**.
  - **Perimeter & Access Security**: **VPC Service Controls (VPC-SC)** to stop data exfiltration, Authorized Views vs. **Authorized Datasets**, Policy Tags (Column-Level Security), and CMEK vs. CSEK.
  - **BigQuery FinOps**: On-Demand vs. BigQuery Editions (Standard/Enterprise/Enterprise Plus) autoscaling slot reservations and **Idle Slot Sharing**.

### 2. 🧭 Architecture Decision Matrix
Interactive `IF Requirement -> THEN Service -> WHY` reference cards across:
- **Storage & Databases** (GCS, Cloud SQL, AlloyDB, Spanner, BigQuery, Bigtable, Firestore, Memorystore)
- **Data Ingestion & Pipelines** (Pub/Sub, Dataflow, Dataproc, Data Fusion, Datastream, Dataform, Composer)
- **Machine Learning** (Pre-trained APIs, BQML, AutoML, Custom Vertex AI)

### 3. ⚡ Exam Cram Cheat Sheets
High-yield comparison lists and golden rules for quick review right before your exam session.

### 4. 🎯 Realistic Exam Simulator (`exam-questions.js`)
- **20 Multi-Sentence Scenario Questions** modeled after the real PDE exam difficulty.
- **🎓 Study / Tutor Mode**: Instant answer validation with full architectural explanations of **why the correct answer wins** and **why each of the 3 distractors is wrong**.
- **⏱️ Timed Exam Mode**: 40-minute countdown timer, question flagging (`Flag for Review`), interactive 20-question status grid, and a post-exam **Domain Readiness Breakdown** (75% passing threshold).

---

## 🚀 Quick Start

No build step or external dependencies required!

### Option 1: Run with Python HTTP Server (Recommended)
```bash
python3 -m http.server 8080 --bind 127.0.0.1
```
Then open **`http://127.0.0.1:8080`** in your browser.

### Option 2: Open Directly
Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).

---

## 📁 Project Structure

```text
.
├── index.html          # Main application layout and navigation shell
├── styles.css          # Dark-mode responsive UI styling with GCP brand accents
├── app.js              # SPA controller, markdown table parser, search, and exam engine
├── knowledge-data.js   # Deep-dive GCP curriculum, decision trees, and cheat sheets
├── exam-questions.js   # 20 realistic PDE scenario questions with distractor analysis
└── README.md           # Project documentation and study guide overview
```

---

## 🏆 Recommended Study Workflow

1. **Read & Master Each Module**: Start in the **📚 Deep-Dive Knowledge Base** tab. Read through all 4 domain modules, pay special attention to the yellow **⚡ Exam Trap Alerts**, and click **"Mark Module as Mastered"** as you finish each one (saved automatically in `localStorage`).
2. **Memorize Service Trade-offs**: Review the **🧭 Architecture Decision Matrix** and **⚡ Exam Cram Cheat Sheets** until you can immediately distinguish when to use Bigtable vs. Spanner vs. BigQuery, or FPE vs. CryptoHash vs. Date Shifting.
3. **Practice in Tutor Mode**: Switch to **🎯 Realistic Exam Simulator** in **🎓 Study / Tutor Mode** to step through scenarios and read why every wrong option is a trap.
4. **Take the Timed Assessment**: Reset the simulator, switch to **⏱️ Timed Exam Mode**, and aim for **$\ge$ 80%** across all four domains.
