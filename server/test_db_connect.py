
import sys
import os
sys.path.append(os.getcwd())
try:
    from config.db import users_collection, client
    print(f"Users collection: {users_collection}")
    if client:
        print("Client exists")
        try:
            client.admin.command('ping')
            print("Ping successful")
        except Exception as e:
            print(f"Ping failed: {e}")
    else:
        print("Client is None")
except Exception as e:
    print(f"Import failed: {e}")
