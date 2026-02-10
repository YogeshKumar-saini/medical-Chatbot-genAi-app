import logging
from server.config.db import users_collection
from bson import ObjectId

logger = logging.getLogger(__name__)


def fix_null_emails(delete=False):
    """Find users with null or missing email and either delete them or assign a placeholder.
    Args:
        delete (bool): If True, delete the offending documents. If False, assign a placeholder email.
    """
    query = {"email": {"$in": [None, ""]}}
    users = list(users_collection.find(query))
    if not users:
        logger.info("No users with null or empty email found.")
        return
    logger.info(f"Found {len(users)} user(s) with null/empty email.")
    for user in users:
        if delete:
            users_collection.delete_one({"_id": user["_id"]})
            logger.info(f"Deleted user {_id_str(user['_id'])}.")
        else:
            placeholder = f"placeholder_{str(user['_id'])}@example.com"
            users_collection.update_one({"_id": user["_id"]}, {"$set": {"email": placeholder}})
            logger.info(f"Updated user {_id_str(user['_id'])} with placeholder email {placeholder}.")
    logger.info("Migration completed.")


def _id_str(oid):
    return str(oid)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fix null email entries in users collection.")
    parser.add_argument("--delete", action="store_true", help="Delete users with null email instead of assigning placeholder.")
    args = parser.parse_args()
    fix_null_emails(delete=args.delete)
