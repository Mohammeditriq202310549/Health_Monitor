from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import psutil
import asyncio
import json
import glob
import os
import subprocess
from db import engine
from models import readings
from sqlalchemy import select, update

app = FastAPI()

def get_reading():
    return psutil.cpu_percent(interval=1)#py lib to access hardware

def get_memory_reading():
    return psutil.virtual_memory().percent # Get real live RAM/memory percentage

def get_cpu_temp():
    try:
        temps = psutil.sensors_temperatures() # Read hardware temperature sensors
        if 'coretemp' in temps and temps['coretemp']:
            return temps['coretemp'][0].current
        if 'cpu_thermal' in temps and temps['cpu_thermal']:
            return temps['cpu_thermal'][0].current
        for name, entries in temps.items():
            for entry in entries:
                if entry.current and entry.current > 0:
                    return entry.current
    except Exception:
        pass
    return None

def get_gpu_usage():
    # Read GPU utilization percentage from hardware
    try:
        res = subprocess.check_output(['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'], stderr=subprocess.DEVNULL).decode().strip()
        return float(res.split()[0])
    except Exception:
        pass

    for p in glob.glob('/sys/class/drm/card*/device/gpu_busy_percent'):
        try:
            with open(p, 'r') as f:
                return float(f.read().strip())
        except Exception:
            pass

    for card in glob.glob('/sys/class/drm/card*'):
        act_p = os.path.join(card, 'gt_act_freq_mhz')
        max_p = os.path.join(card, 'gt_max_freq_mhz')
        if os.path.exists(act_p) and os.path.exists(max_p):
            try:
                with open(act_p) as f1, open(max_p) as f2:
                    act = float(f1.read().strip())
                    max_f = float(f2.read().strip())
                    if max_f > 0:
                        return round((act / max_f) * 100.0, 1)
            except Exception:
                pass
    return None

# Python backend logic function to evaluate status rule
def evaluate_alert_status(cpu_usage: float) -> str:
    if cpu_usage > 80: # Alert rule: value > 80 -> status = "warning"
        return "warning"
    else:
        return "ok" # Default status: "ok"

@app.websocket("/ws/metrics") 
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            cpu_usage = get_reading()
            mem_usage = get_memory_reading()
            cpu_temperature = get_cpu_temp()
            gpu_utilization = get_gpu_usage()
            
            # Evaluate alert rule status strictly in Python backend
            status = evaluate_alert_status(cpu_usage)
            
            with engine.begin() as conn: # Open database transaction
                stmt = readings.insert().values(value=cpu_usage, status=status) # Insert reading into readings table
                result = conn.execute(stmt) # Execute query
                inserted_id = result.inserted_primary_key[0] if result.inserted_primary_key else None
            
            # Broadcast metric payload as JSON (supports backward compatibility with raw floats)
            payload = {
                "id": inserted_id,
                "value": cpu_usage,
                "memory_value": mem_usage,
                "cpu_temp": cpu_temperature,
                "gpu_usage": gpu_utilization,
                "status": status,
                "is_warning": status == "warning"
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(2)  # waits ~2 seconds
    except WebSocketDisconnect:
        pass

@app.get("/api/readings/recent")
def get_recent_readings():
    # Fetch the last 10 readings from database ordered by id descending
    with engine.connect() as conn: # Connect to database
        stmt = select(readings).order_by(readings.c.id.desc()).limit(10) # Select latest 10 rows
        results = conn.execute(stmt).mappings().all() # Execute query and fetch mappings
        return [dict(row) for row in results] # Return JSON list of recent readings

@app.get("/api/readings/warnings")
def get_warning_readings():
    # Python backend query to return only warnings from database
    with engine.connect() as conn: # Connect to database
        stmt = select(readings).where(readings.c.status == "warning").order_by(readings.c.id.desc()).limit(10)
        results = conn.execute(stmt).mappings().all()
        return [dict(row) for row in results]
