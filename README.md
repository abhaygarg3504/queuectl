# 🚀 QueueCTL - Background Job Queue System

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v4.0+-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A production-grade CLI-based background job queue system built with Node.js and MongoDB. QueueCTL manages background jobs with worker processes, handles automatic retries using exponential backoff, and maintains a Dead Letter Queue (DLQ) for permanently failed jobs.

## ✨ Features

- 🚀 **Job Enqueueing** - Add jobs via CLI with custom configurations
- 👷 **Multiple Workers** - Run parallel workers for concurrent job processing
- 🔄 **Automatic Retry** - Exponential backoff retry mechanism for failed jobs
- 💀 **Dead Letter Queue** - Isolate permanently failed jobs after max retries
- 💾 **Persistent Storage** - MongoDB-based storage survives restarts
- 📊 **Live Dashboard** - Real-time monitoring of queue statistics
- ⚙️ **Configuration Management** - Customize retry count and backoff parameters
- 🎯 **Graceful Shutdown** - Workers finish current jobs before stopping

## 📋 Requirements

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/queuectl.git
cd queuectl

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### 2. Configure MongoDB

Edit `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/queuectl
LOG_LEVEL=info
```

### 3. Start MongoDB

```bash
# Linux/Mac
mongod

# Windows
net start MongoDB
```

### 4. Run Your First Job

```bash
# Add a job
node bin/queuectl.js enqueue "echo Hello World"

# Start a worker
node bin/queuectl.js worker start

# Check status
node bin/queuectl.js status
```

## 📖 Usage Guide

### Core Commands

#### **Enqueue a Job**

```bash
# Simple command
node bin/queuectl.js enqueue "echo Hello World"

# Using helper script (recommended)
node scripts/add-job.js "echo Testing QueueCTL"

# With custom max retries
node scripts/add-job-json.js "curl https://api.example.com" 5
```

#### **Manage Workers**

```bash
# Start single worker
node bin/queuectl.js worker start

# Start multiple workers
node bin/queuectl.js worker start --count 3

# Stop all workers
node bin/queuectl.js worker stop
```

#### **View Status**

```bash
# Queue statistics
node bin/queuectl.js status

# List all jobs
node bin/queuectl.js list

# List by state
node bin/queuectl.js list --state pending
node bin/queuectl.js list --state completed
node bin/queuectl.js list --state failed
```

#### **Dead Letter Queue Management**

```bash
# View DLQ jobs
node bin/queuectl.js dlq list

# Retry specific job
node bin/queuectl.js dlq retry <job-id>

# Retry all DLQ jobs
node scripts/retry-all-dlq.js
```

#### **Configuration**

```bash
# Set max retries
node bin/queuectl.js config set max-retries 5

# Set backoff base
node bin/queuectl.js config set backoff-base 2

# List all configuration
node bin/queuectl.js config list
```

### Helper Scripts

#### **Live Dashboard**

```bash
node scripts/dashboard.js
```

Real-time monitoring with:
- Queue statistics (pending, processing, completed, failed, dead)
- Active workers and their status
- Recent pending jobs
- Auto-refresh every 2 seconds

#### **Test Suite**

```bash
node scripts/test-queue.js
```

Adds test jobs to verify:
- Simple commands
- Multiple commands
- Custom retry counts
- Delayed execution
- Intentional failures

## 🏗️ Architecture

### System Components

```
┌─────────────┐
│   CLI       │ ← User Interface
└──────┬──────┘
       │
┌──────▼──────────────────────────┐
│   Job Manager                   │
│   - Enqueue jobs                │
│   - Query statistics            │
│   - DLQ management              │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   MongoDB Storage               │
│   - Jobs Collection             │
│   - Workers Collection          │
│   - Config Collection           │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│   Worker Processes              │
│   - Poll for jobs               │
│   - Execute commands            │
│   - Handle retries              │
└─────────────────────────────────┘
```

### Job Lifecycle

```
   PENDING
      │
      ▼
  PROCESSING ──┐
      │        │
      │        │ (failure)
      ▼        ▼
  COMPLETED  FAILED
               │
               │ (retry)
               ├────────► PENDING
               │
               │ (max retries)
               ▼
             DEAD (DLQ)
```

### Data Models

#### Job Schema

```javascript
{
  id: String,           // Unique job identifier
  command: String,      // Command to execute
  state: String,        // pending|processing|completed|failed|dead
  attempts: Number,     // Current attempt count
  max_retries: Number,  // Maximum retry attempts
  locked_by: String,    // Worker ID holding lock
  locked_at: Date,      // Lock timestamp
  next_retry_at: Date,  // Next retry time (for failed jobs)
  last_error: String,   // Last error message
  created_at: Date,     // Creation timestamp
  updated_at: Date      // Last update timestamp
}
```

#### Worker Schema

```javascript
{
  id: String,           // Unique worker identifier
  status: String,       // active|stopped
  current_job: String,  // Currently processing job ID
  last_heartbeat: Date, // Last heartbeat timestamp
  started_at: Date      // Worker start time
}
```

### Retry Logic

**Exponential Backoff Formula:**
```
delay = backoff_base ^ attempts (in seconds)

Example with backoff_base = 2:
- Attempt 1: 2^1 = 2 seconds
- Attempt 2: 2^2 = 4 seconds
- Attempt 3: 2^3 = 8 seconds
```

### Concurrency Control

- **Job Locking**: Uses MongoDB atomic operations to prevent duplicate processing
- **Heartbeat System**: Workers send heartbeat every 30 seconds
- **Stale Job Recovery**: Jobs locked for >10 minutes are automatically released
- **Graceful Shutdown**: Workers finish current job before stopping

## 🧪 Testing

### Manual Testing

```bash
# 1. Add test jobs
node scripts/test-queue.js

# 2. Start workers in new terminal
node bin/queuectl.js worker start --count 2

# 3. Monitor with dashboard
node scripts/dashboard.js

# 4. Check results
node bin/queuectl.js status
node bin/queuectl.js dlq list
```

### Test Scenarios Covered

1. ✅ **Basic Success** - Simple echo commands complete successfully
2. ✅ **Multiple Commands** - Chained commands execute properly
3. ✅ **Custom Retries** - Jobs with custom max_retries work correctly
4. ✅ **Exponential Backoff** - Failed jobs retry with increasing delays
5. ✅ **DLQ Movement** - Jobs move to DLQ after max retries exhausted
6. ✅ **Concurrent Workers** - Multiple workers process different jobs
7. ✅ **Graceful Shutdown** - Workers finish jobs before stopping
8. ✅ **Persistence** - Jobs survive system restarts
9. ✅ **Stale Jobs** - Locked jobs are released after timeout

### Current Test Results

Based on testing:
- ✅ 8 jobs completed successfully
- ✅ 4 jobs in Dead Letter Queue (after retry exhaustion)
- ✅ Multiple workers running concurrently
- ✅ All CLI commands functional

## 📂 Project Structure

```
queuectl/
├── bin/
│   └── queuectl.js           # Main CLI entry point
├── src/
│   ├── cli/
│   │   ├── commands/         # CLI command implementations
│   │   │   ├── enqueue.js
│   │   │   ├── worker.js
│   │   │   ├── status.js
│   │   │   ├── list.js
│   │   │   ├── dlq.js
│   │   │   └── config.js
│   │   └── index.js          # CLI setup
│   ├── models/
│   │   ├── job.js            # Job Mongoose model
│   │   ├── worker.js         # Worker Mongoose model
│   │   └── config.js         # Config Mongoose model
│   ├── services/
│   │   ├── jobmanager.js     # Job management logic
│   │   ├── workermanager.js  # Worker management logic
│   │   ├── configmanager.js  # Configuration management
│   │   └── executor.js       # Command execution
│   ├── storage/
│   │   ├── db.js             # Database connection
│   │   ├── jobRepo.js        # Job repository
│   │   └── workerRepo.js     # Worker repository
│   ├── utils/
│   │   ├── logger.js         # Logging utility
│   │   └── retry.js          # Retry logic
│   └── worker/
│       ├── constants.js      # Worker constants
│       └── worker-process.js # Worker process logic
├── scripts/
│   ├── dashboard.js          # Live monitoring dashboard
│   ├── test-queue.js         # Test suite
│   ├── add-job.js            # Helper to add jobs
│   ├── add-job-json.js       # Add jobs with JSON
│   └── retry-all-dlq.js      # Retry all DLQ jobs
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## ⚙️ Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `max-retries` | Maximum retry attempts before DLQ | 3 |
| `backoff-base` | Exponential backoff base | 2 |

## 🔧 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongo --eval "db.version()"

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/queuectl
```

### Workers Not Processing Jobs

```bash
# Check worker status
node bin/queuectl.js status

# View worker logs
# Workers log to console - check terminal output

# Release stale jobs manually
# Workers automatically release jobs locked >10 minutes
```

### Jobs Stuck in Processing

- Workers automatically release stale jobs after 10 minutes
- Restart workers if needed: `node bin/queuectl.js worker stop` then start again

## 🎯 Design Decisions & Trade-offs

### Decisions Made

1. **MongoDB over SQLite**: Better concurrency support and scalability
2. **Process-based Workers**: Better isolation and fault tolerance than threads
3. **Polling over Push**: Simpler implementation, good enough for most use cases
4. **Exponential Backoff**: Prevents thundering herd on external service failures
5. **Heartbeat System**: Detects dead workers and releases their jobs

### Trade-offs

1. **Polling Interval**: 2-second polling balances responsiveness vs. database load
2. **No Job Priority**: Keeps implementation simple, FIFO processing
3. **No Scheduled Jobs**: Focus on core queue functionality
4. **File Logging**: Simple console logging instead of log aggregation

## 🚀 Future Enhancements

- [ ] Job priority queues
- [ ] Scheduled/delayed job execution
- [ ] Job output logging to database
- [ ] Web-based monitoring dashboard
- [ ] Webhook notifications for job completion
- [ ] Job dependencies and workflows
- [ ] Rate limiting per job type

## 📝 License

MIT License - feel free to use this project for learning or production use.

## 👤 Author

Created as part of a technical assessment to demonstrate:
- System design capabilities
- Clean code architecture
- Concurrency handling
- CLI development
- Database operations

## 🙏 Acknowledgments

- Built with Node.js, MongoDB, and Commander.js
- Inspired by production queue systems like Sidekiq and Bull

---

**Made with ❤️ for scalable background job processing**
