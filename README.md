# CardEcon

## Setup

### 1. Create and activate Conda environment

```bash
conda create -n cardecon python=3.11 -y
conda activate cardecon
```

### 2. Install backend dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Start the database and Redis

```bash
docker compose up postgres redis -d
```

### 5. Run the backend

```bash
python -m uvicorn app.main:app --reload
```

### 6. Install and run the frontend

```bash
cd ../frontend
npm install
npm start
```
