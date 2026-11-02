import json
import os
from pathlib import Path

settings = json.loads(Path("/pgadmin4/servers.template.json").read_text())
server = settings["Servers"]["1"]
server["Username"] = os.environ["POSTGRES_USER"]

storage = Path("/var/lib/pgadmin/storage") / os.environ[
    "PGADMIN_DEFAULT_EMAIL"
].replace("@", "_")
storage.mkdir(parents=True, exist_ok=True)
passfile = storage / ".pgpass"
fields = [
    server["Host"],
    str(server["Port"]),
    "*",
    server["Username"],
    os.environ["POSTGRES_PASSWORD"],
]
passfile.write_text(
    ":".join(field.replace("\\", "\\\\").replace(":", "\\:") for field in fields) + "\n"
)
passfile.chmod(0o600)
Path(os.environ["PGADMIN_SERVER_JSON_FILE"]).write_text(json.dumps(settings))
