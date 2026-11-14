"""Update the image and health probes while preserving live app settings."""
import argparse
import json
import os
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image")
    args = parser.parse_args()
    app = os.environ.get("CONTAINER_APP", "perako-api")
    group = os.environ.get("RESOURCE_GROUP", "perako-rg")
    az = "az.cmd" if os.name == "nt" else "az"
    result = subprocess.run(
        [az, "containerapp", "show", "--name", app, "--resource-group", group, "--output", "json"],
        check=True, capture_output=True, text=True,
    )
    live = json.loads(result.stdout)
    template = {key: value for key, value in live["properties"]["template"].items() if value is not None}
    container = next(item for item in template["containers"] if item["name"] == "perako-api")
    # CLI responses include preview-only metadata rejected by the update API.
    for item in template["containers"]:
        item.pop("imageType", None)
    if args.image:
        container["image"] = args.image
    container["probes"] = [
        {"type": "Startup", "httpGet": {"path": "/up", "port": 8080, "scheme": "HTTP"},
         "initialDelaySeconds": 1, "periodSeconds": 2, "timeoutSeconds": 3,
         "failureThreshold": 120, "successThreshold": 1},
        {"type": "Readiness", "httpGet": {"path": "/up", "port": 8080, "scheme": "HTTP"},
         "periodSeconds": 5, "timeoutSeconds": 3, "failureThreshold": 3, "successThreshold": 1},
        {"type": "Liveness", "tcpSocket": {"port": 8080}, "periodSeconds": 10,
         "timeoutSeconds": 5, "failureThreshold": 3, "successThreshold": 1},
    ]
    # The template can contain environment values. Never print it or commit it.
    descriptor, filename = tempfile.mkstemp(suffix=".json", prefix="perako-deploy-")
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump({"properties": {"template": template}}, output)
        subprocess.run(
            [az, "rest", "--method", "patch", "--url",
             live["id"] + "?api-version=2026-07-01", "--body", "@" + filename, "--output", "none"],
            check=True,
        )
    finally:
        os.remove(filename)
    print("Configured HTTP startup and readiness probes: /up on port 8080")


if __name__ == "__main__":
    main()
