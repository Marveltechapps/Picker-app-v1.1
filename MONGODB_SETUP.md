# MongoDB local setup (Windows)

## 1. Download MongoDB Community

1. Open: **https://www.mongodb.com/try/download/community**
2. Choose:
   - **Version:** 7.0 or 8.0 (current)
   - **Platform:** Windows
   - **Package:** msi
3. Click **Download**.

## 2. Install

1. Run the downloaded `.msi`.
2. Choose **Complete** installation.
3. **Important:** Check **"Install MongoDB as a Service"** so it starts automatically.
4. Leave default port **27017**.
5. Finish the installer.

## 3. Start MongoDB

### If you chose “Install as a Service”

- MongoDB should start automatically after install.
- To start/restart manually:
  1. Press **Win + R** → type `services.msc` → Enter.
  2. Find **MongoDB Server**.
  3. Right‑click → **Start** (or **Restart**).

Or in **PowerShell as Administrator**:

```powershell
net start MongoDB
```

### If you did not install as a service

Create a data folder and start MongoDB manually:

```powershell
# Create data directory (run once)
New-Item -ItemType Directory -Force -Path "C:\data\db"

# Start MongoDB (path may vary; check Program Files)
& "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
```

Keep this window open while you use the app.

## 4. Check that it’s running

In a new terminal:

```powershell
mongosh
```

If you see a MongoDB shell prompt, the server is running. Type `exit` to leave.

## 5. Use with this project

The backend `.env` is already set for local MongoDB:

```env
MONGODB_URI=mongodb://localhost:27017/builtglory_20
```

Start your backend (e.g. `npm start` in the `backend` folder). It will connect to the local database `builtglory_20`; the database and collections will be created when the app runs.

---

## Optional: Run with Docker (if you install Docker later)

From the project root:

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then keep using `MONGODB_URI=mongodb://localhost:27017/builtglory_20` in `backend/.env`.
