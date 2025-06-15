const schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://leafgon.com/elements/schema/directus",
    "title": "DirectusConfig",
    "description": "A schema describing Directus config data",
    "type": "object",
    "properties": {
        "nodeuuid": {
            "description": "The unique identifier for a server-side instance of Directus",
            "type": "string"
        },
        "status": {
            "description": "The current status of the server-side instance",
            "type": "string"
        },
        "config": {
            "type": "object",
            "properties": {
                "KEY": {"type": "string"},
                "SECRET": {"type": "string"},
                "ADMIN_EMAIL": {"type": "string"},
                "ADMIN_PASSWORD": {"type": "string"},
                "DB_CLIENT": {"type": "string"},
                "DB_HOST": {"type": "string"},
                "DB_PORT": {"type": "string"},
                "DB_DATABASE": {"type": "string"},
                "DB_USER": {"type": "string"},
                "DB_PASSWORD": {"type": "string"}
            },
            "required": ["KEY","SECRET","ADMIN_EMAIL","ADMIN_PASSWORD","DB_CLIENT","DB_HOST","DB_PORT","DB_DATABASE","DB_USER","DB_PASSWORD"]
        }
    },
    "required": ["nodeuuid", "status"]
};

export default schema;