from os import getenv
from dotenv import load_dotenv

load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
SECRET_KEY = getenv("SECRET_KEY")