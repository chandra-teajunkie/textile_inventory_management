import os
import json
from app.utils.logger_setup import logger

CONFIG_DIR = os.path.join(os.getcwd(), "config")
APP_CONFIG_PATH = os.path.join(CONFIG_DIR, "app_config.json")
DEFAULT_CONFIG_PATH = os.path.join(CONFIG_DIR, "default_app_config.json")

with open(DEFAULT_CONFIG_PATH, "r") as default_config_file:
    DEFAULT_CONFIG = json.load(default_config_file)


def process_app_config():
    """Load and validate app_config.json, logging missing/defaulted values one by one."""

    if not os.path.exists(APP_CONFIG_PATH):
        logger.error(f"Config file missing: {APP_CONFIG_PATH}.")
        return

    with open(APP_CONFIG_PATH, "r") as app_config_file:
        app_config = json.load(app_config_file)

    validated_config = {}

    # Check each value individually
    if "app_mode" in app_config:
        validated_config["app_mode"] = app_config["app_mode"]
        logger.info(f"✔ Config 'app_mode' set: {app_config['app_mode']}")
    else:
        validated_config["app_mode"] = DEFAULT_CONFIG["app_mode"]
        logger.warning(
            f"⚠ 'app_mode' missing! Defaulted to: {DEFAULT_CONFIG['app_mode']}"
        )

    if "db_type" in app_config:
        validated_config["db_type"] = app_config["db_type"]
        logger.info(f"✔ Config 'db_type' set: {app_config['db_type']}")
    else:
        validated_config["db_type"] = DEFAULT_CONFIG["db_type"]
        logger.warning(
            f"⚠ 'db_type' missing! Defaulted to: {DEFAULT_CONFIG['db_type']}"
        )

    if "backend_port" in app_config:
        validated_config["backend_port"] = app_config["backend_port"]
        logger.info(f"✔ Config 'backend_port' set: {app_config['backend_port']}")
    else:
        validated_config["backend_port"] = DEFAULT_CONFIG["backend_port"]
        logger.warning(
            f"⚠ 'backend_port' missing! Defaulted to: {DEFAULT_CONFIG['backend_port']}"
        )

    if "backend_host" in app_config:
        validated_config["backend_host"] = app_config["backend_host"]
        logger.info(f"✔ Config 'backend_host' set: {app_config['backend_host']}")
    else:
        validated_config["backend_host"] = DEFAULT_CONFIG["backend_host"]
        logger.warning(
            f"⚠ 'backend_host' missing! Defaulted to: {DEFAULT_CONFIG['backend_host']}"
        )

    if "sql_lite_db_url" in app_config:
        validated_config["sql_lite_db_url"] = app_config["sql_lite_db_url"]
        logger.info(f"✔ Config 'sql_lite_db_url' set: {app_config['sql_lite_db_url']}")
    else:
        validated_config["sql_lite_db_url"] = DEFAULT_CONFIG["sql_lite_db_url"]
        logger.warning(
            f"⚠ 'sql_lite_db_url' missing! Defaulted to: {DEFAULT_CONFIG['sql_lite_db_url']}"
        )

    return validated_config
