# DaVinci Research System - Server & Worker Architecture

A powerful research system with asynchronous job processing, WebSocket support, and persistent file-based queuing.

## 🏗️ Architecture Overview

### Components

1. **Flask Server** (`server.py`) - REST API with WebSocket support
2. **Worker Process** (`worker.py`) - Background job processor
3. **Queue Manager** (`queue_manager.py`) - File-based persistent job queue
4. **System Runner** (`run_system.py`) - Orchestrates both processes

### Features

- ✅ **Asynchronous Processing** - Jobs queued and processed in background
- ✅ **WebSocket Support** - Real-time job status updates
- ✅ **Persistent Queue** - File-based storage survives restarts
- ✅ **Job Tracking** - Complete status and result management
- ✅ **Graceful Shutdown** - Safe process termination
- ✅ **Auto-restart** - Processes automatically restart if they crash

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up Environment

Create a `.env` file with your configuration:
```bash
# Add any environment variables needed
```

### 3. Run the System

```bash
# Run both server and worker together
python run_system.py

# Or run individually
python server.py    # In one terminal
python worker.py    # In another terminal
```

## 📡 API Endpoints

### Research & Workflows

#### Submit Research Job
```http
POST /research
Content-Type: application/json

{
    "query": "What are the main concepts about drones?"
}
```

**Response:**
```json
{
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "queued",
    "message": "Research job added to queue. Use WebSocket or polling to get results."
}
```

#### Submit Workflow Job
```http
POST /workflows
Content-Type: application/json

{
    "query": "How to setup a drone maintenance workflow?"
}
```

### Job Management

#### Get Job Status
```http
GET /job_status/{job_id}
```

**Response:**
```json
{
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "processing",
    "updated_at": 1699123456.789,
    "message": "Found 5 relevant documents, analyzing..."
}
```

#### Get Job Result
```http
GET /job_result/{job_id}
```

**Response:**
```json
{
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "result": {
        "answer": "Based on your notes, here are the main drone concepts...",
        "sources": [
            {
                "content": "Drone basics include...",
                "distance": 0.1234,
                "metadata": {"source": "drone_manual.md"}
            }
        ],
        "query": "What are the main concepts about drones?",
        "processed_at": 1699123456.789
    },
    "completed_at": 1699123456.789
}
```

#### Get Queue Statistics
```http
GET /queue_stats
```

**Response:**
```json
{
    "pending_jobs": 3,
    "jobs": [
        {
            "id": "abc123",
            "query": "What are drone regulations...",
            "created_at": 1699123456.789
        }
    ]
}
```

### Legacy Endpoints

#### Direct Ask (Synchronous)
```http
POST /ask
Content-Type: application/json

{
    "query": "Quick question about drones"
}
```

**Response:**
```json
{
    "answer": "Based on your notes..."
}
```

## 🔌 WebSocket Events

Connect to `ws://localhost:5000`

### Client → Server Events

#### Monitor Specific Job
```javascript
socket.emit('monitor_job', {
    job_id: '123e4567-e89b-12d3-a456-426614174000'
});
```

#### Get Queue Status
```javascript
socket.emit('get_queue_status');
```

### Server → Client Events

#### Connection Established
```javascript
socket.on('connected', (data) => {
    console.log(data.message); // "Connected to job monitoring"
});
```

#### Job Status Update
```javascript
socket.on('job_status', (data) => {
    console.log('Job Status:', data);
    // {
    //     job_id: "...",
    //     status: "processing",
    //     message: "Analyzing documents...",
    //     updated_at: 1699123456.789
    // }
});
```

#### Job Result Available
```javascript
socket.on('job_result', (result) => {
    console.log('Job Completed:', result);
    // Complete result object with answer and sources
});
```

#### Queue Status
```javascript
socket.on('queue_status', (data) => {
    console.log('Queue:', data);
    // { pending_jobs: 3, jobs: [...] }
});
```

## 📁 File Structure

```
server/
├── server.py              # Main Flask server with WebSocket
├── worker.py              # Background job processor
├── queue_manager.py       # File-based queue management
├── run_system.py          # System orchestrator
├── requirements.txt       # Python dependencies
├── README.md             # This file
└── queue/                # Queue storage (auto-created)
    ├── jobs/             # Job definitions
    ├── status/           # Job status files
    ├── results/          # Job results
    └── queue.lock        # File locking
```

## 🔧 Configuration

### Queue Settings

The queue system is configurable through the `QueueManager` class:

```python
# Custom queue directory
queue_manager = QueueManager(queue_dir="custom_queue")

# Cleanup old jobs (default: 24 hours)
queue_manager.cleanup_old_jobs(max_age_hours=48)
```

### Worker Settings

Workers can be configured for different processing behaviors:

```python
# Multiple workers for parallel processing (run multiple worker.py instances)
# Each worker will pick up jobs from the shared queue
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Queue Lock Issues**
   ```bash
   # Remove lock file if processes crashed
   rm queue/queue.lock
   ```

3. **Worker Not Processing Jobs**
   - Check worker logs for errors
   - Verify ChromaDB connection
   - Ensure Ollama is running on localhost:11434

### Monitoring

- **Worker Logs**: Shows job processing progress
- **Server Logs**: Shows API requests and WebSocket connections
- **Queue Files**: Check `queue/` directory for job states

## 🧪 Testing

### Test Job Submission
```bash
curl -X POST http://localhost:5000/research \
  -H "Content-Type: application/json" \
  -d '{"query": "test research query"}'
```

### Test WebSocket Connection
```javascript
const socket = io('http://localhost:5000');
socket.on('connected', (data) => console.log('Connected:', data));
socket.emit('get_queue_status');
```

## 📈 Performance

- **Concurrent Jobs**: Workers process one job at a time per instance
- **Scaling**: Run multiple worker instances for parallel processing
- **Queue Persistence**: All jobs survive server restarts
- **Memory Usage**: Minimal - jobs stored on filesystem

## 🛠️ Development

### Adding New Job Types

1. Add processing logic to `worker.py`
2. Create new endpoint in `server.py`
3. Update job type handling in queue system

### Custom Queue Backends

The queue system can be extended to support other storage backends:
- Database queues (PostgreSQL, Redis)
- Cloud queues (AWS SQS, GCP Pub/Sub)
- Message brokers (RabbitMQ, Apache Kafka)

## 🔒 Security Notes

- Currently configured for local development
- Add authentication for production use
- Secure WebSocket connections with authentication
- Validate and sanitize all inputs 