from loguru import logger
import json
import os

# Load configuration files
CONFIG_DIR = os.path.join(os.getcwd(), "config")
LOGGER_CONFIG_PATH = os.path.join(CONFIG_DIR, "logger_config.json")
APP_CONFIG_PATH = os.path.join(CONFIG_DIR, "app_config.json")

with open(LOGGER_CONFIG_PATH, "r") as log_config_file:
    log_config = json.load(log_config_file)

with open(APP_CONFIG_PATH, "r") as app_config_file:
    app_config = json.load(app_config_file)

# Get app mode
APP_MODE = app_config.get("app_mode", "dev").lower()

# Log directories
if log_config["log_dir"] != "":
    LOG_DIR = log_config["log_dir"]
else:
    LOG_DIR = os.path.join(os.getcwd(), "logs")
    os.makedirs(LOG_DIR, exist_ok=True)

# Separate log files
INFO_LOG_FILE = os.path.join(LOG_DIR, "info.log")
ERROR_LOG_FILE = os.path.join(LOG_DIR, "error.log")

# Remove default logger
logger.remove()

# Console logs only in dev mode
if APP_MODE == "dev":
    logger.add(
        sink=lambda msg: print(msg, end=""),
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>{message}</cyan>",
        level="DEBUG",  # Show everything in console (for dev)
    )

# Separate file for INFO & DEBUG logs
logger.add(
    INFO_LOG_FILE,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="DEBUG",
    rotation="10 MB",
    retention="7 days",
)

# Separate file for ERROR logs
logger.add(
    ERROR_LOG_FILE,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="ERROR",  # Only logs ERROR and CRITICAL
    rotation="5 MB",
    retention="14 days",
)

logger.info(
    f"Logger initialized. Mode: {APP_MODE.upper()} | Info Log: {INFO_LOG_FILE} | Error Log: {ERROR_LOG_FILE}"
)
